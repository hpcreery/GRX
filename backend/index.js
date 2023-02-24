import express from 'express' //  backend route manager/site server
import bodyParser from 'body-parser'
import cors from 'cors' //  some security thing?
import morgan from 'morgan' //  for debugging
import { port } from './src/config/config.js' // server config properties
// var busboy = require('connect-busboy') // for multipart file handling

const app = express()
app.use(morgan('combined')) // log formatting for debugging site hits
app.use(bodyParser.json())
app.use(cors())
// app.use(busboy())


// import routes.js for URL routing. Passes 'app' object
import routes from './src/routes.js'
routes(app)

// Start
app.listen(port)
console.log(`Server Started on port ${port}`)
