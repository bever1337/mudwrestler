/// @ts-check
/* eslint-env browser */

import { createElement } from "react";
import { createRoot } from "react-dom/client";

import { App } from "./app";

navigator.serviceWorker
  .register("./service-worker.js", { scope: "./" })
  .then((registration) => {
    console.log("registered", registration);

    const container = document.querySelector("#d3-mount");
    if (container !== null) {
      const root = createRoot(container);
      root.render(createElement(App));
    }

    const worker =
      registration.installing ?? registration.waiting ?? registration.active;
    if (worker) {
      worker.addEventListener("statechange", (e) => {
        console.log("state changed", e.target);
      });
    }
  })
  .catch((anyError) => {
    console.error("sw failed", anyError);
  });
