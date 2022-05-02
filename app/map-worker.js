/// @ts-check
/* eslint-env serviceworker */
import * as xpath from "xpath";
import { DOMParser } from "xmldom";

const VERSION = 1;
const CACHE_REQUEST = new Request("/maps/map.xml");

/**
 * @type {Record<string, (arg0: any) => void>}
 */
const serviceEvents = {
  /**
   * this worker is ready to receive requests
   * @param {ExtendableEvent} activateEvent
   */
  activate: function onActivate(activateEvent) {
    activateEvent.waitUntil(
      caches
        .keys()
        .then((keys) =>
          Promise.all(
            keys.map((key) => {
              console.log("have key", key);
              if (key === `demo-v${VERSION}`) {
                return Promise.resolve();
              }
              console.log("deleting");
              // return caches.delete(key);
              return Promise.resolve();
            })
          )
        )
        .then(() => {
          console.log(VERSION, "activated!");
        })
        .catch((cacheError) => {
          console.log("failed to cleanup old caches", cacheError);
        })
    );
  },

  contentdelete: function onContentDelete() {
    //
  },

  /**
   *
   * @param {FetchEvent} fetchEvent
   */
  fetch: function onFetch(fetchEvent) {
    console.log("> fetch request", fetchEvent.request);
    const fetchUrl = new URL(fetchEvent.request.url); // todo this can throw
    const path = fetchUrl.pathname.toLowerCase();
    const xpathQuery = fetchUrl.searchParams.get("xpath");
    if (path === "/maps/map.xml") {
      return fetchEvent.respondWith(
        caches.open(`demo-v${VERSION}`).then((cache) =>
          cache.match(fetchEvent.request).then((cachedResponse) => {
            if (cachedResponse) {
              // cachedResponse could be /maps/map.xml OR a query result
              return Promise.resolve(cachedResponse);
            }
            if (xpathQuery !== null && xpathQuery.length > 0) {
              // query is not cached
              return cacheAndResolveMap()
                .then((resp) => resp.text())
                .then((textResponse) => {
                  let t0 = performance.now();
                  const parser = new DOMParser();
                  const xmlDocument = parser.parseFromString(
                    textResponse,
                    "application/xml"
                  );
                  let t1 = performance.now();
                  console.log("parsed: ", t1 - t0);
                  const result = xpath.evaluate(
                    xpathQuery,
                    xmlDocument,
                    null,
                    0, // XPathResult.ANY_TYPE
                    null
                  );
                  t0 = performance.now();
                  console.log("queried", t0 - t1);
                  console.log("xpath result", result);
                  const response = new Response(
                    `${result?.valueOf()?.toString() ?? 6669}`,
                    {
                      status: 200,
                    }
                  );
                  return response;
                });
            }
            console.warn("WHY IS THE MAP NOT CACHED?");
            return cacheAndResolveMap(fetchEvent.request);
          })
        )
      );
    }
  },

  /**
   * first event, only happens ONCE
   * @param {ExtendableEvent} installEvent
   */
  install: function onInstall(installEvent) {
    installEvent.waitUntil(
      cacheAndResolveMap()
        .then(() => {
          console.log("successfully installed");
        })
        .catch((error) => {
          console.warn("install error", error);
          return Promise.reject(error);
        })
    );
  },

  /**
   *
   * @param {MessageEvent} messageEvent
   */
  message: function onMessage(messageEvent) {
    console.log("I got a message, how nice", messageEvent.data);
  },

  notificationclick: function onNotificationClick() {
    //
  },

  notificationclose: function onNotificationClose() {
    //
  },

  push: function onPush() {
    //
  },

  pushsubscriptionchange: function onPushSubscriptionChange() {
    //
  },
};

function cacheAndResolveMap(request = CACHE_REQUEST) {
  return caches.open(`demo-v${VERSION}`).then(function findCachedMap(cache) {
    return cache
      .match(request)
      .then(function resolveCachedMapOrRefetch(cachedResponse) {
        if (cachedResponse) return cachedResponse;
        return fetch(request)
          .catch((fetchError) => {
            console.warn(
              "Failed to proxy maps request, using default",
              fetchError
            );
            if (request !== CACHE_REQUEST) {
              return fetch(CACHE_REQUEST);
            }
            return Promise.reject(fetchError); // proxy error
          })
          .then((response) => {
            cache.put(CACHE_REQUEST, response.clone()); // todo this can reject
            return response;
          });
      });
  });
}

(function (context) {
  Object.entries(serviceEvents).forEach(([event, handler]) => {
    context.addEventListener(event, handler);
  });
})(self);
