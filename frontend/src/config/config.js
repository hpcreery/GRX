const dotenv = require('dotenv')
dotenv.config()

module.exports = {
  backendurl: process.env.REACT_APP_API || 'http://grx.creery.org',
  port: process.env.REACT_APP_APIPORT || '/api',
}
