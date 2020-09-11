const odb2gbr = require('./utilities/odb2gbr')
const gbr2svg = require('./utilities/gbr2svg')
const odbinfo = require('./controllers/odbinfo')

const express = require('express')

module.exports = (app) => {
  // ############  AUTH  ############

  // app.post('/register', AuthenticationControllerPolicy.register, NewAuthenticationController.register)

  // app.post('/login', NewAuthenticationController.login)

  // ############  GBR2SVG  ############

  app.get('/gbr2svg/info', gbr2svg.moduleInfo)

  app.get('/gbr2svg/getExampleSVG', gbr2svg.getExampleSVG)

  app.get('/gbr2svg/getFinishedArtwork', gbr2svg.getFinishedArtwork)

  app.get('/gbr2svg/getAllLayers', gbr2svg.getAllLayers)

  // ############  ODB2GBR  ############

  app.get('/odb2gbr/info', odb2gbr.moduleInfo)

  // ############  ODBINFO  ############

  app.get('/odbinfo/info', odbinfo.moduleInfo)

  app.get('/odbinfo/getJobList', odbinfo.getJobList)

  // ############  OTHER  ############

  app.get('/', (req, res) => {
    res.send(
      'You have landed on the Full Stack applicaiton server-side instance. This can be opened for API usage. Documentation to come soon...'
    )
  })

  app.get('/test', (req, res) => {
    res.send('Hello World')
  })

  app.get('/help', (req, res) => {
    res.sendFile(process.cwd() + '/README.md')
  })
}
