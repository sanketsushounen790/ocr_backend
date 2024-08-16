const { Client, HttpConnection } = require("@elastic/elasticsearch");

const elasticClient = new Client({
  node: "http://localhost:9200/",
  Connection: HttpConnection,
});

module.exports = elasticClient;
