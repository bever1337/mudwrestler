/// @ts-check
/* eslint-env browser */

/**
 * @typedef {(request: Request) => Request | undefined} RequestHandler
 * @typedef {RequestHandler | Request | undefined} RequestOrHandler
 * @typedef {(request: Request | undefined) => Response | Promise<Response>} ResponseHandler
 * @typedef {ResponseHandler | Response | Promise<Response>} ResponseOrHandler
 * @typedef {[RequestOrHandler, ResponseOrHandler]} HandlerTuple
 * 
 * @typedef {CacheQueryOptions & { excludeFragment?: boolean }} RouterOptions
 */

/**
 * Applies default CacheQueryOptions over input of undefined or CacheQueryOptions
 * @param {RouterOptions} [options]
 * @returns {{ [key in keyof CacheQueryOptions]-?: CacheQueryOptions[key]; } & { excludeFragment: boolean }}
 */
export function getOptions({
  excludeFragment = true,
  ignoreSearch = false,
  ignoreMethod = false,
  ignoreVary = false,
} = {}) {
  return { excludeFragment, ignoreMethod, ignoreSearch, ignoreVary };
}

/**
 * @documentation https://www.w3.org/TR/service-workers/#dom-cache-matchall
 * @param {HandlerTuple[]} handlers
 * @param {string | Request} queryRequest
 * @param {RouterOptions} [options]
 * @returns {(Response | Promise<Response>)[]}
 * Based on the implementation of DOM Cache matchAll API. Matches requests and returns an array of Responses or pending Responses.
 * The primary difference from the Cache API is that `matchAll` does not accept undefined `queryRequest`. This is useful when dealing
 * with opaque caches, but is not relevant for a Router controlled by the developer.
 * If `requestOrHandler` is undefined, the corresponding Response handler is treated as a wildcard and is invoked for every request.
 * If `requestOrHandler` is a function, returning undefined is a short-cut and no Request matching will be performed.
 * Else, see `requestsMatch` for documentation on request matching
 */
export function matchAll(handlers, queryRequest, options) {
  /** @type {Request} - Internal usage of queryRequest */
  let r;
  if (queryRequest instanceof Request) {
    // Spec change: router has no opinion on which methods can be affected by `ignoreMethod`
    r = queryRequest;
  } else {
    // Else assume queryRequest is a string. Request construction is allowed to throw.
    r = new Request(queryRequest);
  }
  /** @type {(Response | Promise<Response>)[]} */
  const responses = [];
  /** @type {undefined | Request} */
  let handledRequest;
  for (let [requestOrHandler, responseOrHandler] of handlers) {
    if (typeof requestOrHandler === "undefined") {
      // `requestOrHandler` was not provided, then treat `responseOrHandler` as wildcard and invoke for every request
      responses.push(unwrapResponse(responseOrHandler, undefined));
    } else {
      // Else, let `handledRequest` be the the Request of requestOrHandler or the returned Request from requestOrHandler
      handledRequest = unwrapRequest(requestOrHandler, r);
      if (
        typeof handledRequest !== "undefined" &&
        requestsMatch(r, handledRequest, options)
      ) {
        // If `handledRequest` was provided and requests match:
        responses.push(unwrapResponse(responseOrHandler, r));
      }
    }
  }
  return responses;
}

/**
 * @documentation https://www.w3.org/TR/service-workers/#request-matches-cached-item-algorithm
 * @param {Request} queryRequest
 * @param {Request} handlerRequest
 * @param {RouterOptions} [options]
 * @returns {boolean}
 */
export function requestsMatch(queryRequest, handlerRequest, options) {
  const o = getOptions(options);
  if (
    o.ignoreMethod === false &&
    queryRequest.method !== handlerRequest.method
  ) {
    // 1. If options.ignoreMethod is false and request’s method does not match requestQuery's method, then return false
    return false;
  }
  // 2. Let queryURL be requestQuery’s url.
  const queryURL = new URL(queryRequest.url);
  // 3. Let handledURL be request handler’s returned url.
  const handlerURL = new URL(handlerRequest.url);
  if (o.excludeFragment === true) {
    // 4. If options.excludeFragment is true, then set URL fragments to empty string
    queryURL.hash = "";
    handlerURL.hash = "";
  }
  if (o.ignoreSearch === true) {
    // 5. If options.ignoreSearch is true, then set search URL property to empty string
    queryURL.search = "";
    handlerURL.search = "";
  }
  // 6. If queryURL does not equal handledURL, then return false.
  // 7. Return true.
  return queryURL.toString() === handlerURL.toString();
}

/**
 * TODO somehow figure out typescript overload typings and only export one unwrapper
 * @param {RequestOrHandler} requestOrHandler
 * @param {Request} queryRequest
 * @returns {Request | undefined}
 */
export function unwrapRequest(requestOrHandler, queryRequest) {
  if (typeof requestOrHandler === "function") {
    return requestOrHandler(queryRequest);
  }
  return requestOrHandler;
}

/**
 * TODO somehow figure out typescript overload typings and only export one unwrapper
 * @param {ResponseOrHandler} responseOrHandler
 * @param {Request | undefined} [queryRequest]
 * @returns {Response | Promise<Response>}
 */
export function unwrapResponse(responseOrHandler, queryRequest) {
  if (typeof responseOrHandler === "function") {
    return responseOrHandler(queryRequest);
  }
  return responseOrHandler;
}
