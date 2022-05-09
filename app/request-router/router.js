/// @ts-check
/* eslint-env browser */

import { matchAll } from "./index";

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
   * @param {string | Request} request
   * @param {import(".").RouterOptions} [options]
   */
  match(request, options) {
    return matchAll(this.handlers, request, options);
  }
}
