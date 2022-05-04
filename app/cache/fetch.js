/// @ts-check
/* eslint-env worker */

/**
 * @module
 * Window and worker friendly fetch caching
 */

import { CACHE_NAME } from "./constants";

/**
 * Always sends the fetch request and the response is always cached. The cache is never read.
 * This is useful if a non-cached response is required, but the cache should still be updated
 * Usage is identical to fetch.
 * @param {Request} request
 * @returns {Promise<Response>}
 */
export function fetchAround(request) {
  return Promise.all([caches.open(CACHE_NAME), fetch(request)]).then(
    ([cache, response]) =>
      cache.put(request, response.clone()).then(() => response)
  );
}

/**
 * Attempts to retrieve request from cache. If cache miss, fetch and update cache.
 * Behavior is identical to fetch.
 * @param {Request} request
 * @returns {Promise<Response>}
 */
export function fetchThrough(request) {
  return caches.open(CACHE_NAME).then((cache) => {
    return cache.match(request).then((cacheMatch) => {
      if (cacheMatch) {
        return Promise.resolve(cacheMatch);
      }
      return fetch(request).then((response) => {
        cache.put(request, response.clone());
        return response;
      });
    });
  });
}
