const WebSocket = require("ws");
const server = require("http").createServer();
const express = require("express");
const bodyParser = require('body-parser');
const redis = require("redis");

var config = require("./config.json");

const PORT = config.port;
const REDIS_PORT = config.redisClusterPort;
const REDIS_HOST = config.redisClusterHost;

const redisClient = redis.createClient(REDIS_PORT, REDIS_HOST);
const app = express();

// parse requests of content-type - application/json
app.use(bodyParser.json());

// parse requests of content-type - application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));

// Add headers
app.use(function (req, res, next) {

  // Website you wish to allow to connect
  res.setHeader('Access-Control-Allow-Origin', '*');

  // Request methods you wish to allow
  res.setHeader('Access-Control-Allow-Methods', '*');

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

app.get('/', (req, res) => {
  res.send('Hello World!')
});

app.get('/message', getCacheMessages);

app.post('/message', saveAndSendMessage);

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

function saveAndSendMessage(req, res, next) {
  var message = req.body.message;
  if (message) {
    redisClient.rpush(MESSAGES, message, function (err, reply) {
      if (err) {
        res.send(err);
      } else {
        res.send("Mensaje guardado");
      }
    });
    wss.clients.forEach(function each(client) {
      if (client.readyState === WebSocket.OPEN) {
        const data = {
          "message": message,
        };
        client.send(JSON.stringify(data));
      }
    });
    res.send('Mensaje enviado');
    return;
  }
  res.send('Fallo envío de mensaje');
  return;
}

function getCacheMessages(req, res, next) {
  redisClient.lrange(MESSAGES, 0, -1, function (err, replies) {
    if (err) {
      res.send(err);
    } else {
      if (replies) {
        replies.forEach(function (reply, index) {
          console.log("Valor " + index + ": " + reply);
        });
        res.send(replies);
      } else {
        res.send([]);
      }
    }
  });
}