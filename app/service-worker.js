/// @ts-check
/* eslint-env serviceworker */

import { CACHE_ID, CACHE_NAME, CACHE_VERSION } from "./cache/constants";
import { achaeaRouter } from "./modules/achaea/service-worker-router";

export const INTERNAL_VERSION = 1;

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
          console.log(CACHE_VERSION, "activated!");
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
    fetchEvent.waitUntil(
      new Promise((resolveWaitUntil, rejectWaitUntil) => {
        switch (new URL(fetchEvent.request.url).hostname) {
          case "achaea.com":
            return achaeaRouter
              .handle(fetchEvent.request)
              .then(fetchEvent.respondWith)
              .finally(() => resolveWaitUntil(null));
          default:
            return resolveWaitUntil(null);
        }
      })
    );
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
