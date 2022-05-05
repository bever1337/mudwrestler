/* eslint-env node */

/* eslint-disable @typescript-eslint/no-var-requires */
const { build } = require("esbuild");
const pluginCopyStaticFiles = require("esbuild-copy-static-files");
/* eslint-enable @typescript-eslint/no-var-requires */

build({
  bundle: true,
  define: {
    "process.env.NODE_ENV": '"development"',
  },
  entryPoints: [
    "app/profiles/achaea/index.js",
    "app/profiles/achaea/service-worker.js",
  ],
  outdir: "public/profiles/achaea",
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
