const app = require("express");
const fetch = require("node-fetch");
const redis = require("redis");
var config = require("./config.json");
var http = require('http').createServer(app);
var io = require('socket.io')(http);

const PORT = 3000;
const REDIS_PORT = config.redisClusterPort;
const REDIS_HOST = config.redisClusterHost;

const redisClient = redis.createClient(REDIS_PORT, REDIS_HOST)

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
  console.log('a user connected');
  socket.on('disconnect', () => {
      console.log('user disconnected');
  });
  socket.on('chat message', (msg) => {
      io.emit('chat message', msg);
  });
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