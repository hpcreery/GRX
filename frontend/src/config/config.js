const dotenv = require('dotenv');
dotenv.config();

module.exports = {
  port: 8081,

  backendurl: 'http://192.168.0.100:8081',

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
};
