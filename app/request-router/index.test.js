/* eslint-env jest */
import * as polyfills from "whatwg-fetch";
import { getOptions, matchAll, requestsMatch, unwrapRequest } from ".";
import { Router } from "./router";

describe("getOptions", () => {
  it("Always returns ignoreSeach, ignoreMethod, and ignoreVary", () => {
    expect(
      [
        getOptions(),
        getOptions({}),
        getOptions({ ignoreSearch: true }),
        getOptions({ ignoreMethod: false }),
        getOptions({ ignoreVary: 581 }),
      ].every(
        (returnedOptions) =>
          "ignoreMethod" in returnedOptions &&
          "ignoreSearch" in returnedOptions &&
          "ignoreVary" in returnedOptions
      )
    ).toBe(true);
  });

  it("Does not return additional properties", () => {
    expect("foo" in getOptions({ foo: "bar" })).toBe(false);
  });

  it("Accepts string-indexable objects or undefined", () => {
    expect(() => {
      getOptions();
    }).not.toThrow();
    expect(() => {
      getOptions({});
    }).not.toThrow();
    expect(() => {
      getOptions(null);
    }).toThrow();
    expect(() => {
      getOptions(() => ({ ignoreMethod: true }));
    }).not.toThrow();
  });

  it("Current implementation always returns `ignoreVary: true`", () => {
    expect(getOptions({ ignoreVary: false }).ignoreVary).toBe(true);
    expect(getOptions({}).ignoreVary).toBe(true);
    expect(getOptions().ignoreVary).toBe(true);
  });
});

describe("matchAll", () => {
  it("Treats undefined requestOrHandler as a responseOrHandler wildcard", () => {
    /** @type {import(".").HandlerTuple[]} */
    const wildcardHandlers = [
      [undefined, jest.fn(() => new polyfills.Response(null, { status: 200 }))],
    ];
    const testRequest = new polyfills.Request("https://example.com");
    const responseHandlers = matchAll(wildcardHandlers, testRequest);
    expect(responseHandlers.length).toBe(1);
    expect(wildcardHandlers[0]?.[1]).toBeCalledTimes(1);
    expect(wildcardHandlers[0]?.[1]).toBeCalledWith(testRequest);
  });

  it("Returns all matches", () => {
    /** @type {import(".").HandlerTuple[]} */
    let duplicateHandlers = [
      [
        new polyfills.Request("https://example.com"),
        jest.fn(() => new polyfills.Response(null, { status: 200 })),
      ],
      [
        new polyfills.Request("https://example.com"),
        jest.fn(() => new polyfills.Response(null, { status: 200 })),
      ],
    ];
    let testRequest = new polyfills.Request("https://example.com");
    let responseHandlers = matchAll(duplicateHandlers, testRequest);
    expect(responseHandlers.length).toBe(2);
    expect(duplicateHandlers[0]?.[1]).toBeCalledTimes(1);
    expect(duplicateHandlers[0]?.[1]).toBeCalledWith(testRequest);
    expect(duplicateHandlers[1]?.[1]).toBeCalledTimes(1);
    expect(duplicateHandlers[1]?.[1]).toBeCalledWith(testRequest);

    duplicateHandlers = [
      [
        new polyfills.Request("https://example.com"),
        jest.fn(() => new polyfills.Response(null, { status: 200 })),
      ],
      [undefined, jest.fn(() => new polyfills.Response(null, { status: 200 }))],
    ];
    testRequest = new polyfills.Request("https://example.com");
    responseHandlers = matchAll(duplicateHandlers, testRequest);
    expect(responseHandlers.length).toBe(2);
    expect(duplicateHandlers[0]?.[1]).toBeCalledTimes(1);
    expect(duplicateHandlers[0]?.[1]).toBeCalledWith(testRequest);
    expect(duplicateHandlers[1]?.[1]).toBeCalledTimes(1);
    expect(duplicateHandlers[1]?.[1]).toBeCalledWith(testRequest);
  });
});

describe("requestsMatch", () => {
  it("Matches requests by method", () => {
    const getExample = new polyfills.Request("https://example.com", {
      method: "GET",
    });
    const postExample = new polyfills.Request("https://example.com", {
      method: "POST",
    });
    expect(requestsMatch(getExample, postExample)).toBe(false);
    expect(requestsMatch(getExample, postExample, { ignoreMethod: true })).toBe(
      true
    );
  });

  it("Does not match URL fragment by default", () => {
    const fragmentExample = new polyfills.Request("https://example.com/#foo");
    const noFragmentExample = new polyfills.Request("https://example.com");
    expect(requestsMatch(fragmentExample, noFragmentExample)).toBe(true);
    expect(
      requestsMatch(fragmentExample, noFragmentExample, {
        excludeFragment: false,
      })
    ).toBe(false);
  });

  it("Does match URL query by default", () => {
    const searchExample = new polyfills.Request("https://example.com?foo=bar");
    const noSearchExample = new polyfills.Request("https://example.com");
    expect(requestsMatch(searchExample, noSearchExample)).toBe(false);
    expect(
      requestsMatch(searchExample, noSearchExample, { ignoreSearch: true })
    ).toBe(true);
  });

  it("Matches by protocol", () => {
    const httpExample = new polyfills.Request("http://example.com");
    const httpsExample = new polyfills.Request("https://example.com");
    expect(requestsMatch(httpExample, httpsExample)).toBe(false);
  });

  it("Matches by origin", () => {
    const origin2Example = new polyfills.Request("https://example2.com");
    const originExample = new polyfills.Request("https://example.com");
    expect(requestsMatch(origin2Example, originExample)).toBe(false);
  });
});

describe("Router", () => {
  it("Uses a constructor", () => {
    expect(() => {
      new Router();
    }).not.toThrow();
    expect(() => {
      /** @type {any} */
      const notAConstructor = Router;
      notAConstructor();
    }).toThrow();
  });

  it("Provides a stateful interface around handlers", () => {
    const testRouter = new Router();
    const handlers = testRouter.handlers;
    expect(Array.isArray(testRouter.handlers)).toBe(true);
    expect(testRouter.handlers.length).toBe(0);
    testRouter.handle(
      new polyfills.Request("https://example.com"),
      () => new polyfills.Response(null, { status: 200, statusText: "OK" })
    );
    expect(testRouter.handlers.length).toBe(1);
    expect(handlers).toBe(testRouter.handlers);
  });

  it("Does not validate handlers", () => {
    const testRouter = new Router();
    testRouter.handle("foo", "bar");
    expect(testRouter.handlers[0]).toEqual(["foo", "bar"]);
  });

  it("Handlers are ordered", () => {
    const testRouter = new Router();
    testRouter.handle("fee", "fie");
    testRouter.handle("foe", "fum");
    expect(testRouter.handlers).toEqual([
      ["fee", "fie"],
      ["foe", "fum"],
    ]);
  });
});

describe("unwrap", () => {
  it("Invokes first parameter second parameter if first parameter is typeof function", () => {
    const handler = jest.fn();
    const inputArgument = { foo: "baz" };
    unwrapRequest(handler, inputArgument);
    expect(handler).toBeCalledTimes(1);
    expect(handler).toBeCalledWith(inputArgument);
  });
  it("Returns first parameter if it is not a function", () => {
    const inputValue = { foo: "bar" };
    expect(unwrapRequest(inputValue)).toBe(inputValue);
    expect(unwrapRequest(inputValue)).toEqual(inputValue);
  });
});
