// Node
const fs = require('fs')
const path = require('path')
const process = require('process')
const util = require('util')
const { execSync, exec, spawn, spawnSync } = require('child_process')

console.log('GBR2SVG: converting .gbr to .svg')

module.exports = {
  testModule(req, res) {
    console.log('GBR2SVG test:', req.query)
    res.status(200).send(req.query)
  },

  getSVG(req, res) {
    console.log(req.query)
    res.status(200).send('worked')
  },

  doesSVGExist(req, res) {},

  getAllSVG(req, res) {},

  getIndividualSVG(req, res) {},

  getFinalSVG(req, res) {},

  isGerberReady(req, res) {},
}
