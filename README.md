# Contributing

## Setup

Because workers and indexeddb often require secure contexts, it's recommended to generate an HTTPS key pair. `foo.crt` and `bar.key` are in the `.gitignore`.

```bash
# generate keypair:
openssl req -newkey rsa:4096 -x509 -sha256 -days 365 -nodes -out ./foo.crt -keyout bar.key

# mudwrestler is currently developed with node ^16.14.0 and npm ^8.4.0.
# check node and npm versions:
node --version
npm --version

# install dependencies:
npm install
```

## Develop

```bash
# Starts a process to build and watch app for changes
node ./esbuild.js --watch
# Starts another process to host the builds on https://localhost:8080
npx http-server --tls --cert ./foo.crt --key ./bar.key
```

## Build

```bash
# Same as develop, but doesn't watch
node ./esbuild.js
```

## Test

Babel is required to support types and jest. See `babel.config.js` and `jest.config.js`

```bash
# not much in the way of tests yet
npm run test
```
