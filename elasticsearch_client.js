const { Client, HttpConnection } = require('@elastic/elasticsearch')

const elasticClient = new Client({
  // maxRetries: 5,
  // requestTimeout: 60000,
  // sniffOnStart: true,
  node: 'http://localhost:9200/',
  Connection: HttpConnection
})

module.exports = elasticClient