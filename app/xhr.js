/// @ts-check
/* eslint-env browser */
/**
 * @module
 * Provides wrappers around common XHR behavior to create and clone Request objects
 */

/**
 * Opens the input XMLHttpRequest and returns a new Request
 * @param {XMLHttpRequest} xhr
 * @param {string} method
 * @param {string} url
 * @returns {Request}
 */
export function open(xhr, method, url) {
  xhr.open(method, url, true);
  return new Request(url, { method });
}

/**
 * Promisifies xhr send and resolves a response.
 * @param {XMLHttpRequest} xhr
 * @param {Request} request
 * @param {Blob|BufferSource|FormData|URLSearchParams} [body = null]
 * @returns {Promise<Response>}
 */
export function send(xhr, request, body) {
  xhr.send(body);
  return promisifySend(xhr, mergeInit(request, { body: body ?? null }));
}

/**
 * Always sends xhr. Response is always cached. Cache is never read.
 * @param {XMLHttpRequest} xhr
 * @param {Request} request
 * @param {Blob|BufferSource|FormData|URLSearchParams} [body = null]
 * @returns {Promise<Response>}
 */
export function sendAround(xhr, request, body) {
  const sentRequest = mergeInit(request, { body: body ?? null });
  xhr.send(body);
  return Promise.all([
    caches.open("xhr"),
    promisifySend(xhr, sentRequest),
  ]).then(([cache, response]) =>
    cache.put(sentRequest, response).then(() => response)
  );
}

/**
 * Attempts to retrieve request from cache.
 * Cache hits resolve Response and the xhr `send` is never called.
 * Cache misses will `send` the xhr and resolve a Response on 'load'. Response is cached.
 * In case of cache miss, response can be accessed on xhr AND resolved Response.
 * @param {XMLHttpRequest} xhr
 * @param {Request} request
 * @param {Blob|BufferSource|FormData|URLSearchParams} [body = null]
 * @returns {Promise<Response>}
 */
export function sendThrough(xhr, request, body) {
  const sentRequest = mergeInit(request, { body: body ?? null });
  return caches.open("xhr").then((cache) => {
    return cache.match(sentRequest).then((cacheMatch) => {
      console.log("cacheMatch", cacheMatch);
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
 * Creates a new response from an xhr in `readyState` `4` and a corresponding request
 * @param {XMLHttpRequest} xhr
 * @param {Request} request
 * @returns {Response}
 */
function intoResponse(xhr, request) {
  return new Response(xhrToFetchBodyInits[xhr.responseType]?.(xhr) ?? null, {
    headers: new Headers(request.headers),
    status: xhr.status,
    statusText: xhr.statusText,
  });
}

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
      resolve(intoResponse(xhr, request));
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
