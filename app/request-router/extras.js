/// @ts-check
/* eslint-env browser */

/**
 * @param {string} pathExpression
 * @param {((request: Request | undefined, options: { params: {[key: string]: string;} | undefined }) => Request | undefined) | Request} requestOrHandler
 * @param {((request: Request | undefined, options: { params: {[key: string]: string;} | undefined }) => Response | Promise<Response> | undefined) | Response | undefined} response
 */
export function handleExpression(pathExpression, requestOrHandler, response) {
  /* eslint-disable no-useless-escape */
  let regExp = RegExp(
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
     * @param {Request | undefined} queryRequest
     * @returns {Request | undefined}
     */
    (queryRequest) => {
      if (!queryRequest) {
        return undefined;
      }
      const queryRequestUrl = new URL(queryRequest.url);
      const match = queryRequestUrl.pathname.match(regExp);
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
        new URL(queryRequestUrl.pathname, new URL(unwrappedRequest.url).origin),
        queryRequest
      );
    },
    /**
     * @param {Request | undefined} request
     * @returns {Response | Promise<Response> | undefined}
     */
    (request) => {
      if (typeof response === "function") {
        return response(request, { params });
      }
      return response;
    },
  ];
}
