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

ws.on("close", () => {
  console.log("Client disconnected");
});

ws.on('message', function incoming(data) {
  wss.clients.forEach(function each(client) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
});

server.get('/', (req, res) => {
  res.send('Hello World!')
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});