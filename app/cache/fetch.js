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
 * @param {string} url
 * @param {RequestInit} init
 * @returns {Promise<Response>}
 */
export function fetchAround(url, init) {
  const sentRequest = new Request(url, init);
  return Promise.all([caches.open(CACHE_NAME), fetch(sentRequest)]).then(
    ([cache, response]) =>
      cache.put(sentRequest, response).then(() => response.clone())
  );
}

/**
 * Attempts to retrieve request from cache. If cache miss, fetch and update cache.
 * Behavior is identical to fetch.
 * @param {string} url
 * @param {RequestInit} init
 * @returns {Promise<Response>}
 */
export function fetchThrough(url, init) {
  const sentRequest = new Request(url, init);
  return caches.open(CACHE_NAME).then((cache) => {
    return cache.match(sentRequest).then((cacheMatch) => {
      if (cacheMatch) {
        return Promise.resolve(cacheMatch);
      }
      return fetch(sentRequest).then((response) => {
        cache.put(sentRequest, response);
        return response;
      });
    });
  });
}
