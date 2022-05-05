/* eslint-env browser */

/**
 * @typedef {(request: Request, ...args: any) => Response | Promise<Response>} Handler
 * @typedef {(path: string, ...handlers: Handler[]) => Router} Route
 * @typedef {{ all: Route, get: Route, head: Route, post: Route, put: Route, delete: Route, connect: Route, options: Route, trace: Route, patch: Route }} CommonRoutes
 *
 * @param {Object} [options]
 * @param {string} [options.base=""]
 * @param {[string, RegExp, Handler[]][]} [options.routes=[]]
 * @returns {{ routes: [string, RegExp, Handler[]][], handle: Handle } & CommonRoutes & { [any:string]: Route }}
 */
export function Router({ base = "", routes = [] } = {}) {
  return {
    __proto__: new Proxy(
      {},
      {
        get:
          (target, prop, receiver) =>
          /**
           *
           * @param {string} route
           * @param  {((request: Request, ...args: any) => Response | Promise<Response>)[]} handlers
           * @returns
           */
          (route, ...handlers) =>
            routes.push([
              prop.toString().toUpperCase(),
              /* eslint-disable no-useless-escape */
              RegExp(
                `^${
                  (base + route)
                    .replace(/(\/?)\*/g, "($1.*)?") // trailing wildcard
                    .replace(/\/$/, "") // remove trailing slash
                    .replace(/:(\w+)(\?)?(\.)?/g, "$2(?<$1>[^/]+)$2$3") // named params
                    .replace(/\.(?=[\w(])/, "\\.") // dot in path
                    .replace(/\)\.\?\(([^\[]+)\[\^/g, "?)\\.?($1(?<=\\.)[^\\.") // optional image format
                }/*$`
                /* eslint-enable no-useless-escape */
              ),
              handlers,
            ]) && receiver,
      }
    ),

    routes,

    /**
     * @typedef {Object} IttyRequest
     * @property {{ [key: string]: string | undefined }} [query]
     * @property {{ [key: string]: string }} [params]
     *
     * @callback Handle
     * @param {Request & IttyRequest} request - Request
     * @param  {...any} extra - Sdditional arguments to pass to the first matched handler
     * @returns {undefined | Response | Promise<Response>} - A returned promise indicates a route match
     *
     * @type {Handle}
     */
    handle(request, ...extra) {
      let response,
        match,
        url = new URL(request.url);
      for (let [method, route, handlers] of routes) {
        if (
          (method === request.method || method === "ALL") &&
          (match = url.pathname.match(route))
        ) {
          request.params = match.groups;
          request.query = Object.fromEntries(url.searchParams);
          for (let handler of handlers) {
            if ((response = handler(request, ...extra)) !== undefined) {
              return response;
            }
          }
        }
      }
      return undefined;
    },
  };
}
