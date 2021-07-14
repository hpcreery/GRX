const dotenv = require('dotenv')
dotenv.config()

module.exports = {
  backendurl: process.env.REACT_APP_GRX_API || 'https://grx.creery.org',
  port: process.env.REACT_APP_GRX_APIPORT || '/api',
}
