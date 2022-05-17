/// @ts-check
/* eslint-env worker */
// import { Router } from "../../itty-router";
import { matchAll } from "../../request-router";
import { handleExpression } from "../../request-router/extras";
import { xmlParse, xsltProcess } from "xslt-processor";

import { CACHE_ID, CACHE_NAME } from "../../cache/constants";
import { fetchThrough } from "../../cache/fetch";

export const INTERNAL_VERSION = 2;

const router = [
  handleExpression(
    "/maps/achaea/:mapId.json",
    new Request(self.location.origin), // check pathname for same origin requests
    (request) => {
      return caches.open(CACHE_NAME).then((cache) => {
        return cache.match(request).then((cacheMatch) => {
          if (typeof cacheMatch !== "undefined") {
            return cacheMatch;
          }
          return Promise.all([
            fetchThrough(
              new Request("https://achaea.com/maps/map.xml", request)
            ),
            fetchThrough(new Request("/maps/achaea/map.xsl")),
          ])
            .then(([xmlResponse, xslResponse]) =>
              Promise.all([xmlResponse.text(), xslResponse.text()])
            )
            .then(([xmlText, xslText]) => {
              const jsonMapResponse = new Response(
                xsltProcess(xmlParse(xmlText), xmlParse(xslText)),
                { status: 200 }
              );
              return cache
                .put(request, jsonMapResponse.clone())
                .then(() => jsonMapResponse);
            });
        });
      });
    }
  ),
  handleExpression(
    "/maps/:mapId.xml",
    new Request("https://achaea.com"),
    fetchThrough
  ),
];

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
              if (key.startsWith(CACHE_ID) && key !== CACHE_NAME) {
                return caches.delete(key);
              }
              return Promise.resolve();
            })
          )
        )
        .then(() => {
          console.log(INTERNAL_VERSION, "activated!");
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
    const responses = matchAll(router, fetchEvent.request);
    if (responses[0]) {
      console.log(`router handled ${fetchEvent.request.url}:`, responses);
      try {
        fetchEvent.respondWith(responses[0]);
      } catch (err) {
        console.error("Router respondwith err:", err);
      }
    }
  },

  /**
   * first event, only happens ONCE
   * @param {ExtendableEvent} installEvent
   */
  install: function onInstall(installEvent) {
    // installEvent.waitUntil(
    //   cacheAndResolveMap()
    //     .then(() => {
    //       console.log("successfully installed");
    //     })
    //     .catch((error) => {
    //       console.warn("install error", error);
    //       return Promise.reject(error);
    //     })
    // );
    console.log("installed");
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

(function (context) {
  Object.entries(serviceEvents).forEach(([event, handler]) => {
    context.addEventListener(event, handler);
  });
})(self);
