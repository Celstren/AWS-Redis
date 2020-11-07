const WebSocket = require("ws");
const server = require("http").createServer();
const express = require("express");
const bodyParser = require('body-parser')
const app = express();

// parse requests of content-type - application/json
app.use(bodyParser.json());

// parse requests of content-type - application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));

// Add headers
app.use(function (req, res, next) {

  // Website you wish to allow to connect
  res.setHeader('Access-Control-Allow-Origin', 'http://ec2-3-23-20-28.us-east-2.compute.amazonaws.com:3000');

  // Request methods you wish to allow
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

  // Request headers you wish to allow
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

  // Set to true if you need the website to include cookies in the requests sent
  // to the API (e.g. in case you use sessions)
  res.setHeader('Access-Control-Allow-Credentials', true);

  // Pass to next layer of middleware
  next();
});

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

app.get('/', (req, res) => {
  res.send('Hello World!')
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});