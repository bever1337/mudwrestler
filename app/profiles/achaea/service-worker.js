/// @ts-check
/* eslint-env worker */
import { Router } from "../../itty-router";
import { xmlParse, xsltProcess } from "xslt-processor";

import { CACHE_ID, CACHE_NAME } from "../../cache/constants";
import { fetchThrough } from "../../cache/fetch";

export const INTERNAL_VERSION = 2;

const sameOriginRouter = Router();
sameOriginRouter.get("/maps/achaea/:mapId.json", (request) => {
  return caches.open(CACHE_NAME).then((cache) => {
    return cache.match(request).then((cacheMatch) => {
      if (typeof cacheMatch !== "undefined") {
        return cacheMatch;
      }
      return Promise.all([
        fetchThrough(new Request("https://achaea.com/maps/map.xml", request)),
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
});

const achaeaRouter = Router();
achaeaRouter.get("/maps/:mapId.xml", fetchThrough);

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
    /** @type {undefined | Response | Promise<Response>} */
    let response;
    switch (new URL(fetchEvent.request.url).hostname) {
      case self.location.hostname: {
        response = sameOriginRouter.handle(fetchEvent.request);
        break;
      }
      case "achaea.com": {
        response = achaeaRouter.handle(fetchEvent.request);
        break;
      }
      default:
        return;
    }
    if (response) {
      console.log(`router handled ${fetchEvent.request.url}?`, response);
      try {
        fetchEvent.respondWith(response);
      } catch (err) {
        console.error("sameOriginRouter respondwith err?", err);
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
