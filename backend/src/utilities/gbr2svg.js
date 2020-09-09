// NODE
const fs = require('fs')
const path = require('path')
const process = require('process')
const util = require('util')
const { execSync, exec, spawn, spawnSync } = require('child_process')

// MODULES
const pcbStackup = require('pcb-stackup')

// CONFIG
const { dir, stackup } = require('../config/config')
const { Console } = require('console')

console.log('GBR2SVG: converting .gbr to .svg')

module.exports = {
  moduleInfo(req, res) {
    console.log('GBR2SVG info query:', req.query)
    res.status(200).send({ Query: req.query })
  },

  // req = { job: XXX }
  async getSVG(req, res) {
    console.log('QUERY PARAMS:', req.query)
    let files = fs.readdirSync(path.join(dir.artwork, req.query.job))
    let gerbers = files.filter((file) => {
      var stats = fs.statSync(path.join(dir.artwork, req.query.job, file))
      if (stats.isFile()) {
        return file
      } else {
        return
      }
      //return path.extname(file).toLowerCase() === '.gbr' || path.extname(file).toLowerCase() === '.drl'
    })
    gerberType = (name) => {
      try {
        return stackup.find((layer) => name.includes(layer.name)).type
      } catch (err) {
        console.log('Irregular Gerber', name)
      }
    }
    gerberSide = (name) => {
      try {
        return stackup.find((layer) => name.includes(layer.name)).side
      } catch (err) {
        console.log('Irregular Gerber', name)
      }
    }
    var layers = gerbers.map((filename) => ({
      filename,
      type: gerberType(filename),
      side: gerberSide(filename),
      gerber: fs.createReadStream(path.join(dir.artwork, req.query.job, filename)),
    }))

    await pcbStackup(layers, { useOutline: true }).then((svgstackup) => {
      //console.log('STACKUP:', svgstackup)
      //console.log('TOPSVG:', svgstackup.top.svg)
      //console.log(stackup.bottom.svg) // logs "<svg ... </svg>"
      //console.log(stackup.bottom.svg) // logs "<svg ... </svg>"
      toplayer = svgstackup.top.svg
      botlayer = svgstackup.bottom.svg
    })

    res.status(200).send({ Query: req.query, Gerbers: gerbers, TopLayer: toplayer, BotLayer: botlayer })
  },

  doesSVGExist(req, res) {},

  getAllSVG(req, res) {},

  getIndividualSVG(req, res) {},

  getFinalSVG(req, res) {},

  isGerberReady(req, res) {},
}
