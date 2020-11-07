const app = require("express")();
const fetch = require("node-fetch");
const redis = require("redis");
var config = require("./config.json");
var http = require('http').createServer(app);
var io = require('socket.io')(http);
var bodyParser = require('body-parser')

const PORT = 3000;
const MESSAGES = 'messages';
const REDIS_PORT = config.redisClusterPort;
const REDIS_HOST = config.redisClusterHost;

const redisClient = redis.createClient(REDIS_PORT, REDIS_HOST)

// parse requests of content-type - application/json
app.use(bodyParser.json());

// parse requests of content-type - application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));

io.on('connection', (socket) => {
  console.log('a user connected');
  socket.on('disconnect', () => {
      console.log('user disconnected');
  });
  socket.on('CHAT_MESSAGE', (msg) => {
      io.emit('CHAT_MESSAGE', msg);
  });
});

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

function sendMessage(req, res, next) {
  let message = req.body.message;
  if (message) {
    socket.emit('CHAT_MESSAGE', message);
    redisClient.rpush(MESSAGES, message, function (err, reply) {
      if (err) {
        res.send(err);
      } else {
        res.send("Mensaje guardado");
      }
    });
  } else {
    res.send("Mensaje inválido");
  }
}

app.post('/messages', sendMessage);

app.get('/messages', getCacheMessages);

pp.get('/', function (req, res, next) {
  console.log("Server started");
});

http.listen(PORT, () => {
  console.log(`Example app listening at http://localhost:${PORT}`)
});

// async function getPublicReposNumber(req, res, next) {
//   try {
//     console.log("Fetching data...");

//     const { username } = req.params;
//     const response = await fetch(`https://api.github.com/users/${username}`);
//     const data = JSON.stringify(await response.json());
//     console.log(`Fetched data ${data}`)

//     redisClient.setex(username, 3600, data);

//     res.send(`Saved successfully`);
//   } catch (error) {
//     console.error(error);
//     res.send({error: error});
//   }
// }

// function cache(req, res, next) {
//   const { username } = req.params;
//   redisClient.get(username, function (error, cachedData) {
//     if (error) throw error;
//     if (cachedData != null) {
//       res.send(`Data from cache ${cachedData}`);
//     } else {
//       next();
//     }
//   })
// }

// app.get('/repos/:username', cache, getPublicReposNumber);