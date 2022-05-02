/// @ts-check
/* eslint-env browser */

/**
 * @module
 * Provides wrappers around common XHR behavior to create Requests and cache Responses.
 * Requests and Responses are (mostly) immutable. Fetch is never used, but cache hits
 * will only resolve Responses, no xhr.
 */

import { CACHE_NAME } from "./constants";

/**
 * Opens the input XMLHttpRequest and returns a new Request
 * @param {XMLHttpRequest} xhr
 * @param {string} method
 * @param {string} url
 * @returns {Request} Request
 * @example
 * ```js
 * const xhrRequest = new XMLHttpRequest();
 * const fetchRequest = open(xhrRequest, 'get', 'https://example.com');
 * ```
 */
export function open(xhr, method, url) {
  xhr.open(method, url, true);
  return new Request(url, { method });
}

/**
 * Always sends the xhr. The cache is never read nor updated.
 * Useful to promisify xhr and create corresponding Request and Response.
 * @param {XMLHttpRequest} xhr
 * @param {Request} request
 * @param {Blob|BufferSource|FormData|URLSearchParams} [body = null]
 * @returns {Promise<Response>}
 * @example
 * ```js
 * const xhrRequest = new XMLHttpRequest();
 * let fetchRequest = open(xhrRequest, 'get', 'https://example.com');
 * // xhr wrappers always clone fetch Request and Response objects
 * fetchRequest = send(xhrRequest, fetchRequest);
 * fetchRequest.then((response) => {
 *   console.log("Response: ", response);
 *   console.log("XHR Response: ", xhrRequest.response);
 * });
 * ```
 */
export function send(xhr, request, body) {
  xhr.send(body);
  return promisifySend(xhr, mergeInit(request, { body: body ?? null }));
}

/**
 * Always sends the xhr and the response is always cached. The cache is never read.
 * This is useful if a non-cached response is required, but the cache should still be updated
 * @param {XMLHttpRequest} xhr
 * @param {Request} request
 * @param {Blob|BufferSource|FormData|URLSearchParams} [body = null]
 * @returns {Promise<Response>}
 * @example
 * ```js
 * const xhrRequest = new XMLHttpRequest();
 * sendAround(xhrRequest, open(xhrRequest, 'get', 'https://example.com'))
 *   .then((response) => {
 *     console.log("Response: ", response);
 *     console.log("XHR Response: ", xhrRequest.response);
 *   });
 * ```
 */
export function sendAround(xhr, request, body) {
  const sentRequest = mergeInit(request, { body: body ?? null });
  xhr.send(body);
  return Promise.all([
    caches.open(CACHE_NAME),
    promisifySend(xhr, sentRequest),
  ]).then(([cache, response]) =>
    cache.put(sentRequest, response).then(() => response)
  );
}

/**
 * Attempts to retrieve request from cache.
 *
 * Cache hit:
 *  - resolve cached Response
 *  - xhr `send` is NEVER called so xhr response properties are inaccessible
 *
 * Cache miss:
 *  - xhr is sent
 *  - resolve and cache response
 *  - Response and xhr response properties are available
 * @param {XMLHttpRequest} xhr
 * @param {Request} request
 * @param {Blob|BufferSource|FormData|URLSearchParams} [body = null]
 * @returns {Promise<Response>}
 * @example
 * ```js
 * const xhrRequest = new XMLHttpRequest();
 * sendThrough(xhrRequest, open(xhrRequest, 'get', 'https://example.com'))
 *   .then((response) => {
 *     console.log("Response: ", response);
 *     console.log("XHR Response: ", xhrRequest.response);
 *   });
 * ```
 */
export function sendThrough(xhr, request, body) {
  const sentRequest = mergeInit(request, { body: body ?? null });
  return caches.open(CACHE_NAME).then((cache) => {
    return cache.match(sentRequest).then((cacheMatch) => {
      if (cacheMatch) {
        return Promise.resolve(cacheMatch);
      }
      xhr.send(body);
      return promisifySend(xhr, request).then((response) =>
        cache
          .put(sentRequest, response.clone())
          .then(() => Promise.resolve(response))
      );
    });
  });
}

/**
 * Sets XMLHttpRequest header and returns a cloned request with updated headers
 * @param {XMLHttpRequest} xhr
 * @param {Request} request
 * @param {string} header
 * @param {string} value
 * @returns {Request}
 */
export function setRequestHeader(xhr, request, header, value) {
  xhr.setRequestHeader(header, value);
  const newHeaders = new Headers(request.headers);
  newHeaders.set(header, value);
  return mergeInit(request, { headers: newHeaders });
}

/**
 *
 * Utilities
 *
 */

/**
 * Immutably clones input RequestInit over Request.
 * `body` property immutability not guaranteed.
 * @param {Request} request
 * @param {RequestInit} init
 * @returns {Request}
 */
function mergeInit(request, init) {
  return new Request(
    request.url,
    Object.assign(
      {
        body: request.bodyUsed ? null : request.body,
        cache: request.cache,
        credentials: request.credentials,
        headers: new Headers(request.headers),
        method: request.method,
        mode: request.mode,
        redirect: request.redirect,
        referrer: request.referrer,
      },
      init
    )
  );
}

/**
 * @type {Record<XMLHttpRequestResponseType, (xhr: XMLHttpRequest) => BodyInit>}
 */
const xhrToFetchBodyInits = {
  arraybuffer: (xhr) => new ArrayBuffer(xhr.response),
  blob: (xhr) => new Blob(xhr.response),
  json: (xhr) => ({ ...xhr.response }),
  [""]: (xhr) => xhr.responseText,
  text: (xhr) => xhr.responseText,
  document: (xhr) => xhr.responseXML?.documentElement.outerHTML ?? "",
};

/**
 * Promisifies XHR. All events will reject.
 * Handler for onload MUST be provided and it MUST resolve a Response.
 * @param {XMLHttpRequest} xhr
 * @param {Request} request
 * @returns {Promise<Response>}
 */
function promisifySend(xhr, request) {
  return new Promise((resolve, reject) => {
    const cleanup = function cleanup() {
      xhr.removeEventListener("load", onXhrLoad);
      xhr.removeEventListener("loadend", cleanupAndReject);
      xhr.removeEventListener("timeout", cleanupAndReject);
    };
    const onXhrLoad = function onXhrLoad() {
      cleanup();
      resolve(
        new Response(xhrToFetchBodyInits[xhr.responseType]?.(xhr) ?? null, {
          headers: new Headers(request.headers),
          status: xhr.status,
          statusText: xhr.statusText,
        })
      );
    };
    /** @param {Event} event */
    const cleanupAndReject = function cleanupAndReject(event) {
      cleanup();
      reject(event);
    };

    xhr.addEventListener("load", onXhrLoad);
    xhr.addEventListener("loadend", cleanupAndReject); // loadend propagates after load, abort, error
    xhr.addEventListener("timeout", cleanupAndReject);
  });
}
