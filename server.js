const WebSocket       = require("ws");
const server          = require("http").createServer();
const express         = require("express");
const bodyParser      = require('body-parser');
const redis           = require("redis");
const mysql           = require('mysql');
const moment          = require('moment-timezone');

var config            = require("./config.json");

const PORT            = config.port;
const REDIS_PORT      = config.redisClusterPort;
const REDIS_HOST      = config.redisClusterHost;
const REDIS_MESSAGES  = "cache_messages";

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

var pool  = mysql.createPool({
  host     : config.mysqlHost,
  port: config.mysqlPort,
  user     : config.mysqlUser,
  password : config.mysqlPassword,
  database : config.database
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

app.get('/messages', getCacheMessages, getMessages);

app.post('/messages', saveMessages);

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

function getCacheMessages(req, res, next) {
  try {
    console.log("Getting data from cache");
    redisClient.smembers(REDIS_MESSAGES, function (err, replies) {
      if (err) {
        res.send(err);
      } else {
        if (replies) {
          res.send(replies);
        } else {
          next();
        }
      }
    });
  } catch (e) {
    res.send(e);
  }
}

function saveMessages(req, res, next) {
  var text = req.body.message;
  var user = req.body.user;
  if (text) {
    var messageData = {
      id: 0,
      text: text,
      user: user,
      date: moment().tz("America/Lima").format(),
    };
    pool.query('INSERT INTO public.message (text, user, createdAt) VALUES ( ? , ? , ? )', [messageData.text, messageData.user, messageData.date], function (error, results, fields) {
      if (error) throw error;
      messageData.id = results.insertId;
      redisClient.sadd(REDIS_MESSAGES, JSON.stringify(messageData), function (err, reply) {
        if (err) {
          res.send(err);
        } else {
          wss.clients.forEach(function each(client) {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify(messageData));
            }
          });
          res.send("Mensaje guardado y enviado");
        }
      });
    });
  } else {
    res.send("Mensaje Inválido");
  }
}

function getMessages(req, res, next) {
  try {
    pool.query('SELECT * FROM public.message', function (error, results, fields) {
      if (error) {
        res.send(error);
        return;
      }
      var multi = redisClient.multi();
      results.forEach(function each(messageData) {
        multi.sadd(REDIS_MESSAGES, JSON.stringify(messageData));
      });
      multi.exec(function(err, response) {
        if(err) throw err; 
        res.send(results);
      })
    });
  } catch (e) {
    res.send(e);
  }
}