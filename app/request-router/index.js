/// @ts-check
/* eslint-env browser */

/**
 * @typedef {[RequestOrHandler, ResponseHandler]} HandlerTuple
 * A pair of Request and Response values or handlers.
 *
 * @callback RequestHandler
 * @param {Request} request
 * @returns {Request | undefined}
 *
 * @typedef {RequestHandler | Request | undefined} RequestOrHandler
 *
 * @callback ResponseHandler
 * @param {Request} request
 * @returns {Response | Promise<Response>}
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
  // ignoreVary = false,
} = {}) {
  return { excludeFragment, ignoreMethod, ignoreSearch, ignoreVary: true };
}

/**
 * @documentation https://www.w3.org/TR/service-workers/#dom-cache-matchall
 * @param {HandlerTuple[]} handlers
 * @param {string | Request} queryRequest
 * @param {RouterOptions} [options]
 * @returns {(Response | Promise<Response>)[]}
 * Matches queryRequest against Request handlers and returns an array of Responses or pending Responses.
 * If the Request portion of the Handler tuple:
 *   - is undefined, then Response portion is treated as a wildcard and is invoked for every request.
 *   - is a function, then invoke the request handler with `queryRequest`. Perform Request matching if returned value is not undefined.
 *   - is a Request, then perform Request matching and conditionally return the Response portion of the tuple
 */
export function matchAll(handlers, queryRequest, options) {
  /** @type {Request} - Internal usage of queryRequest */
  let r;
  if (queryRequest instanceof Request) {
    // Spec change: router has no opinion on which methods can be affected by `ignoreMethod`
    r = queryRequest;
  } else {
    // Else assume queryRequest can be stringified
    r = new Request(queryRequest);
  }
  /** @type {(Response | Promise<Response>)[]} */
  const responses = [];
  /** @type {undefined | Request} */
  let handledRequest;
  for (let [requestOrHandler, responseHandler] of handlers) {
    if (
      typeof requestOrHandler === "undefined" ||
      ((handledRequest = unwrapRequest(requestOrHandler, r)) &&
        requestsMatch(r, handledRequest, options))
    ) {
      // `requestOrHandler` was not provided then `responseOrHandler` is wildcard
      // OR, let `handledRequest` be the Request of requestOrHandler or returned Request of requestOrHandler AND `handledRequest` was provided and requests match
      responses.push(responseHandler(r));
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
