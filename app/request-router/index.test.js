/* eslint-env jest */
import * as polyfills from "whatwg-fetch";
import {
  getOptions,
  matchAll,
  requestsMatch,
  unwrapRequest,
  unwrapResponse,
} from ".";
import { Router } from "./router";

describe("Router", () => {
  it("Uses a constructor", () => {
    expect(() => {
      new Router();
    }).not.toThrow();
    expect(() => {
      Router();
    }).toThrow();
  });

  it("Provides a stateful interface around handlers", () => {
    const testRouter = new Router();
    const handlers = testRouter.handlers;
    expect(Array.isArray(testRouter.handlers)).toBe(true);
    expect(testRouter.handlers.length).toBe(0);
    testRouter.handle(
      new polyfills.Request("https://example.com"),
      new polyfills.Response(null, { status: 200, statusText: "OK" })
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
});

describe("matchAll", () => {
  it("does the thing", () => {
    expect(true).toBe(true);
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
});

describe("unwrap", () => {
  // TODO it is so tedious to require two unwrappers
  /** @param {Function} unwrapper */
  const unwrapTestFn = (unwrapper) => () => {
    const handler = jest.fn();

    const inputArgument = { foo: "baz" };
    unwrapper(handler, inputArgument);
    expect(handler).toBeCalledTimes(1);
    expect(handler).toBeCalledWith(inputArgument);
  };
  /** @param {Function} unwrapper */
  const unwrapTestPassThrough = (unwrapper) => () => {
    const inputValue = { foo: "bar" };
    expect(unwrapper(inputValue)).toBe(inputValue);
    expect(unwrapper(inputValue)).toEqual(inputValue);
  };
  it(
    "Invokes first parameter second parameter if first parameter is typeof function",
    unwrapTestFn(unwrapRequest)
  );
  it(
    "Returns first parameter if it is not a function",
    unwrapTestPassThrough(unwrapRequest)
  );
  it(
    "Invokes first parameter second parameter if first parameter is typeof function",
    unwrapTestFn(unwrapResponse)
  );
  it(
    "Returns first parameter if it is not a function",
    unwrapTestPassThrough(unwrapResponse)
  );
});
