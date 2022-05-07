/* eslint-env browser */

export type RouterQueryOptions = {
  [key in keyof CacheQueryOptions]-?: CacheQueryOptions[key];
};

export type HandledRequest = Request | undefined;
export type RequestHandler = (request: Request | undefined) => HandledRequest;
export type RequestOrHandler = RequestHandler | ReturnType<RequestHandler>;

export type HandledResponse = Response | Promise<Response>;
export type ResponseHandler = (request: Request | undefined) => HandledResponse;
export type ResponseOrHandler = ResponseHandler | ReturnType<ResponseHandler>;

export type HandlerTuple = [RequestOrHandler, ResponseOrHandler];
