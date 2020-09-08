const dotenv = require('dotenv')
dotenv.config()

module.exports = {
  port: 8081,
  mongodb: {
    host: process.env.DB_HOST || '192.168.1.128',
    database: process.env.DB_NAME || 'familyweb',
    user: process.env.DB_USER || 'admin',
    password: process.env.DB_PASS || 'Twinsrock98',
    options: {
      authdb: process.env.DB_AUTH || 'admin',
    },
  },

  authentication: {
    jwtSecret: process.env.JWT_SECRET || 'secret',
  },

  dir: {
    odbdatabase: process.env.ODBDATABASE || process.cwd() + '/public/jobs',
    artwork: process.env.ARTWORK || process.cwd() + '/public/artwork',
    odb2gbr: process.env.ODB2GBR || process.cwd() + '/public/etc',
  },

  stackup: [
    {
      name: 'top',
      side: 'top',
      type: 'copper',
    },
    {
      name: 'art02',
      side: 'inner',
      type: 'copper',
    },
    {
      name: 'art03',
      side: 'inner',
      type: 'copper',
    },
    {
      name: 'bot',
      side: 'bot',
      type: 'copper',
    },
    {
      name: 'smt',
      side: 'top',
      type: 'soldermask',
    },
    {
      name: 'smb',
      side: 'bot',
      type: 'soldermask',
    },
    {
      name: 'sst',
      side: 'top',
      type: 'silkscreen',
    },
    {
      name: 'ssb',
      side: 'bot',
      type: 'silkscreen',
    },
  ],
}
