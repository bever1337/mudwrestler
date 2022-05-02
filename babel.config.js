/* eslint-env node */
/**
 * Babel is used to enable Jest to use typescript
 */

module.exports = {
  presets: [
    ["@babel/preset-env", { targets: { node: "current" } }],
    "@babel/preset-typescript",
  ],
};
