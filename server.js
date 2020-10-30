console.log("Running");

var RedisClustr = require("redis-clustr");
var RedisClient = require("redis");
var config = require("./config.json");

var redis = new RedisClustr({
  servers: [
    {
      host: config.redisClusterHost,
      port: config.redisClusterPort,
    },
  ],
  createClient: function (port, host) {
    // this is the default behaviour
    return RedisClient.createClient(port, host);
  },
});

//connect to redis
redis.on("connect", function () {
  console.log("connected");
});

redis.on("message", function (channel, message) {
  console.log(channel);
  console.log(message);
});

redis.subscribe("my-channel", function (err) {
  redis.publish("my-channel", "have a lovely day!");
});

//check the functioning
redis.set("test", "val", function (err) {
  if (err) {
    // Something went wrong
    console.error("error");
  } else {
    redis.get("test", function (err, value) {
      if (err) {
        console.error("error");
      } else {
        console.log("Worked: " + value);
      }
    });
  }
});

redis.get("name", function (err, reply) {
  if (err) {
    console.error("error");
  } else {
    console.log("Worked: " + reply);
  }
});
