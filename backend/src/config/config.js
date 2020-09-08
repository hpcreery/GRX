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
    pages: process.env.DIR_PUBLIC || process.cwd() + '/public',
  },
}
