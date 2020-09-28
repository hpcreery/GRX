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
    odbdatabase: process.env.ODBDATABASE || '\\\\files\\genjobs\\main\\jobs',
    odbgerboutdir: '/output/gerber',
    artworkdb: process.env.ARTWORKRDB || process.cwd() + '/public/artworkdb/',
    example: process.env.EXAMPLE || process.cwd() + '/public/artwork',
    artwork: process.env.ARTWORK || process.cwd() + '/public/artwork',
    odb2gbr: process.env.ODB2GBR || process.cwd() + '/public/etc',
  },
}
