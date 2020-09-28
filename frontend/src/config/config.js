const dotenv = require('dotenv')
dotenv.config()

module.exports = {
  backendurl: process.env.API || 'http://172.20.7.68',
  port: process.env.APIPORT || ':8081',
}
