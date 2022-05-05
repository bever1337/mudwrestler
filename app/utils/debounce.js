/// @ts-check
/* eslint-env browser */

/**
 * @description
 * Returns a function, that, as long as it continues to be invoked, will not
 * be triggered. The function will be called after it stops being called for
 * N milliseconds. If `immediate` is passed, trigger the function on the
 * leading edge, instead of the trailing.
 * @this any
 * @param {Function} func
 * @param {number} wait
 * @param {boolean} immediate
 * @returns {Function}
 */
export function debounce(func, wait, immediate) {
  /** @type {ReturnType<typeof setTimeout> | null} */
  let timeout;
  /**  @this any */
  return function () {
    const args = arguments;
    // !WARNING! This is one of the few times a function and arrow function are different
    // Don't convert back to function without assigning `this` to a variable
    const later = () => {
      timeout = null;
      if (!immediate) func.apply(this, args);
    };
    const callNow = immediate && !timeout;
    if (timeout !== null) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
    if (callNow) func.apply(this, args);
  };
}
