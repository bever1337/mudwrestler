/// @ts-check
/* eslint-env browser */
/**
 * https://nolanlawson.com/2019/08/11/high-performance-input-handling-on-the-web/
 */

/**
 * @param {(timestamp: number) => void} callback
 */
export function throttleRaf(callback) {
  /** @type {null | Function} */
  let queuedCallback = null;
  if (!queuedCallback) {
    window.requestAnimationFrame((timestamp) => {
      if (queuedCallback) {
        const cb = queuedCallback;
        queuedCallback = null;
        cb(timestamp);
      }
    });
  }
  queuedCallback = callback;
}
