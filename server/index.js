/* eslint-env node */
/* eslint-disable @typescript-eslint/no-var-requires */
const { createServer } = require("https");
// const { readFileSync } = require("fs");
const WebSocket = require("ws");

const httpServer = createServer();
const socketServer = new WebSocket.WebSocketServer({ server: httpServer });
let proxyClient;

const [, , remoteAddress] = process.argv;
if (!remoteAddress) {
  throw new Error("Must provide URL");
}
console.log("connecting to ", "wss://achaea.com/socket");
const remote = new WebSocket("wss://achaea.com/socket/", "binary", {
  followRedirects: true,
});
remote.on("close", function onCloseRemote() {
  console.log("remote closed");
  proxyClient?.close();
  process.exitCode = 1;
});
remote.on("error", function onErrorRemote(event) {
  console.log("remote error", event);
  proxyClient?.close();
  process.exitCode = 1;
});
remote.on("message", function onMessageRemote(event) {
  console.log("received from remote: %s", event);
  proxyClient?.send(event);
});
remote.on("ping", function onRemotePing() {
  console.log("remote ping");
});
remote.on("pong", function onRemotePong() {
  console.log("remote pong");
});
remote.on("open", function onOpenRemote() {
  //
});
remote.on("upgrade", function onRemoteUpgrade() {
  console.log("upgradings");
});

socketServer.on("connection", function connection(ws) {
  proxyClient = ws;
  ws.on("message", function message(event) {
    console.log("received from client: %s", event.data);
    remote?.send(event);
  });
});

httpServer.listen(8081);
