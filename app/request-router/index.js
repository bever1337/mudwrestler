/// @ts-check
/* eslint-env browser */

export class Router {
  constructor() {
    /**
     * @type {import(".").HandlerTuple[]}
     */
    this.handlers = [];
  }

  /**
   * @param {import(".").RequestOrHandler} request
   * @param {import(".").ResponseOrHandler} response
   */
  handle(request, response) {
    this.handlers.push([request, response]);
  }

  /**
   * @param {string | Request} [request]
   * @param {CacheQueryOptions} [options]
   */
  match(request, options) {
    return matchAll(this.handlers, request, options);
  }
}

/**
 * Applies default CacheQueryOptions over input of undefined or CacheQueryOptions
 * @param {CacheQueryOptions} [options]
 * @returns {import(".").RouterQueryOptions} CacheQueryOptions
 */
function getOptions({
  ignoreSearch = false,
  ignoreMethod = false,
  ignoreVary = false,
} = {}) {
  return { ignoreMethod, ignoreSearch, ignoreVary };
}

/**
 * @documentation https://www.w3.org/TR/service-workers/#dom-cache-matchall
 * @param {import(".").HandlerTuple[]} handlers
 * @param {string | Request | undefined} [queryRequest]
 * @param {CacheQueryOptions} [options]
 * @returns {import(".").HandledResponse[]}
 */
export function matchAll(handlers, queryRequest, options) {
  // 1. Let r be undefined (spec change, r is undefined instead of null)
  let r;
  // 2. If the optional argument request is not omitted, then:
  if (queryRequest instanceof Request) {
    // TODO there is probably a better check than instanceof
    // Change from spec: router has no opinion on which methods can be affected by `ignoreMethod`
    // 2. 1. If request is a Request object, then:
    // set r to input queryRequest
    r = queryRequest;
  } else if (typeof queryRequest === "string") {
    // 2. 2. Else if queryRequest is a string, then:
    // set r to the associated request of the result of invoking the initial value of Request as constructor with request as its argument.
    // Spec change: Allow exceptions to throw
    r = new Request(queryRequest);
  } // else { r = undefined }
  // 3. Let responses be an empty list.
  /** @type {import(".").HandledResponse[]} */
  const responses = [];
  /** @type {import(".").HandledRequest} */
  let handledRequest;
  for (let [requestOrHandler, responseOrHandler] of handlers) {
    // 4. For each requestResponse of storage:
    if (typeof r === "undefined" || typeof requestOrHandler === "undefined") {
      // 4. 1. If the optional queryRequest `Request` argument is omitted then:
      // all response handlers are invoked
      // OR if r was provided and handledRequest was not provided then:
      // treat responseOrHandler as wildcard and invoke for every request
      responses.push(unwrapResponse(responseOrHandler, undefined));
      continue;
    }
    // 4. 2. let handledRequest be itself or the result of invoking requestHandler with r
    handledRequest = unwrapRequest(requestOrHandler, r);
    if (handledRequest && requestsMatch(r, handledRequest, options)) {
      // 4. 3. Else if r was provided and `handledRequest` was provided, then:
      // 4. 3. 1. If `requestsMatch` with requestQuery, handledRequest, and options returns true, then:
      // push response for matching request
      responses.push(unwrapResponse(responseOrHandler, r));
    }
  }
  return responses;
}

/**
 * @documentation https://www.w3.org/TR/service-workers/#request-matches-cached-item-algorithm
 * @param {Request} queryRequest
 * @param {Request} handlerRequest
 * @param {CacheQueryOptions} [options]
 * @returns {boolean}
 */
export function requestsMatch(queryRequest, handlerRequest, options) {
  if (
    getOptions(options).ignoreMethod === false &&
    queryRequest.method !== handlerRequest.method
  ) {
    // 1. If options.ignoreMethod is false and request’s method does not match requestQuery's method
    return false;
  }
  const queryURL = new URL(queryRequest.url); // 2. Let queryURL be requestQuery’s url.
  queryURL.hash = ""; // ignore URL fragments
  const handlerURL = new URL(handlerRequest.url); // 3. Let handledURL be request handler’s returned url.
  handlerURL.hash = ""; // ignore URL fragments
  if (getOptions(options).ignoreSearch === true) {
    // 4. If options.ignoreSearch is true, then set search URL property to empty string
    queryURL.search = "";
    handlerURL.search = "";
  }
  if (queryURL.toString() !== handlerURL.toString()) {
    // 5. If queryURL does not equal handledURL with the exclude fragment flag set, then return false.
    return false;
  }
  // 6. Return true.
  return true;
}

/**
 * TODO somehow figure out typescript overload typings and only export one unwrapper
 * @param {import(".").RequestOrHandler} [requestOrHandler]
 * @param {Request | undefined} [queryRequest]
 * @returns {import(".").HandledRequest}
 */
function unwrapRequest(requestOrHandler, queryRequest) {
  if (typeof requestOrHandler === "function") {
    return requestOrHandler(queryRequest);
  }
  return requestOrHandler;
}

/**
 * TODO somehow figure out typescript overload typings and only export one unwrapper
 * @param {import(".").ResponseOrHandler} responseOrHandler
 * @param {Request} [queryRequest]
 * @returns {import(".").HandledResponse}
 */
function unwrapResponse(responseOrHandler, queryRequest) {
  if (typeof responseOrHandler === "function") {
    return responseOrHandler(queryRequest);
  }
  return responseOrHandler;
}
