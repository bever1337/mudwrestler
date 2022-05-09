/// @ts-check
/* eslint-env browser */

/**
 * @param {string} pathExpression
 * @param {((request: Request, options: { params: {[key: string]: string;} | undefined }) => Request | undefined) | Request} requestOrHandler
 * @param {((request: Request, options: { params: {[key: string]: string;} | undefined }) => Response | Promise<Response>)} responseOrHandler
 * @returns {import(".").HandlerTuple}
 */
export function handleExpression(
  pathExpression,
  requestOrHandler,
  responseOrHandler
) {
  /* eslint-disable no-useless-escape */
  let pathRegularExpression = RegExp(
    `^${
      pathExpression
        .replace(/(\/?)\*/g, "($1.*)?") // trailing wildcard
        .replace(/\/$/, "") // remove trailing slash
        .replace(/:(\w+)(\?)?(\.)?/g, "$2(?<$1>[^/]+)$2$3") // named params
        .replace(/\.(?=[\w(])/, "\\.") // dot in path
        .replace(/\)\.\?\(([^\[]+)\[\^/g, "?)\\.?($1(?<=\\.)[^\\.") // optional image format
    }/*$`
  );
  /* eslint-enable no-useless-escape */
  /** @type {{[key: string]: string;} | undefined} */
  let params;
  return [
    /**
     * @param {Request} queryRequest
     * @returns {Request | undefined}
     */
    function requestExpressionHandler(queryRequest) {
      if (!queryRequest) {
        return undefined;
      }
      const queryRequestUrl = new URL(queryRequest.url);
      const match = queryRequestUrl.pathname.match(pathRegularExpression);
      if (!match) {
        return undefined;
      }
      params = match.groups;
      /** @type {Request | undefined} */
      let unwrappedRequest;
      if (typeof requestOrHandler === "function") {
        unwrappedRequest = requestOrHandler(queryRequest, { params });
      } else if (requestOrHandler) {
        unwrappedRequest = requestOrHandler;
      }
      if (!unwrappedRequest) {
        return undefined;
      }
      return new Request(
        new URL(
          queryRequestUrl.pathname,
          new URL(unwrappedRequest.url).origin
        ).toString(),
        queryRequest
      );
    },
    /**
     * @param {Request} request
     * @returns {Response | Promise<Response>}
     */
    function responseHandler(request) {
      if (typeof responseOrHandler === "function") {
        return responseOrHandler(request, { params });
      }
      return responseOrHandler;
    },
  ];
}
