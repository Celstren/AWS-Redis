const WebSocket = require("ws");
const server = require("http").createServer();
const express = require("express");
const app = express();

// serve files from the public directory
server.on("request", app.use(express.static("public")));

// tell the WebSocket server to use the same HTTP server
const wss = new WebSocket.Server({
  server,
});

wss.on("connection", function connection(ws, req) {
  console.log(`Client connected`);
});

wss.on("close", () => {
  console.log("Client disconnected");
});

wss.on('message', function incoming(data) {
  console.log(data);
});

server.get('/', (req, res) => {
  res.send('Hello World!')
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});