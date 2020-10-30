const express = require("express");
const fetch = require("node-fetch");
const redis = require("redis");
var config = require("./config.json");

const PORT = 3000;
const REDIS_PORT = config.redisClusterPort;
const REDIS_HOST = config.redisClusterHost;

const redisClient = redis.createClient(REDIS_PORT, REDIS_HOST)
const app = express()

app.get('/', (req, res) => {
  res.send('Hello World!')
});

async function getPublicReposNumber(req, res, next) {
  try {
    console.log("Fetching data...");

    const { username } = req.params;
    const response = await fetch(`https://api.github.com/users/${username}`);
    const data = await response.json();
    console.log(`Fetched data ${data}`)

    redisClient.setex(username, 3600, data.login);

    res.satus(200).send(setResponse(username, data));
  } catch (error) {
    console.error(error);
    res.status(500).json({error: error});
  }
}

function cache(req, res, next) {
  const { username } = req.params;
  redisClient.get(username, function (error, cachedData) {
    if (error) throw error;
    if (cachedData != null) {
      res.send(setResponse(username, data));
    } else {
      next();
    }
  })
}

app.get('/repos/:username', cache, getPublicReposNumber);

app.listen(PORT, () => {
  console.log(`Example app listening at http://localhost:${PORT}`)
});

/* 
host: config.redisClusterHost,
      port: config.redisClusterPort,
*/