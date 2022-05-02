/* eslint-env node */

/* eslint-disable @typescript-eslint/no-var-requires */
const { build } = require("esbuild");
const pluginCopyStaticFiles = require("esbuild-copy-static-files");
/* eslint-enable @typescript-eslint/no-var-requires */

build({
  entryPoints: ["app/index.js"],
  bundle: true,
  outdir: "public",
  plugins: [
    pluginCopyStaticFiles({
      src: "./www",
      dest: "./public",
      dereference: true,
      preserveTimestamps: true,
      recursive: true,
    }),
  ],
  watch: {
    onRebuild(error, result) {
      console.log("Rebuilt!", error, result);
    },
  },
}).catch(() => process.exit(1));

console.log("Watching for changes...");
