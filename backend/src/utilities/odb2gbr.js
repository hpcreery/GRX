// NODE
const fs = require('fs')
const path = require('path')
const process = require('process')
const util = require('util')
const { execSync, exec, spawn, spawnSync } = require('child_process')

// CONFIG
const { dir } = require('../config/config')

const converter = dir.odb2gbr
const odbdatabase = dir.odbdatabase

console.log('ODB2GBR: extracting gerber from ODB++')

module.exports = {
  moduleInfo(req, res) {
    console.log('ODB2GBR info query:', req.query)
    res.status(200).send({ Query: req.query, Database: odbdatabase, Converter: converter })
  },

  getGerberData(req, res) {
    //spawn
  },

  getStepList(req, res) {},

  isJobReal(req, res) {},
}

// example cmdline execution
// ./odb2gbr_cmdlne64.exe -job:H:\test\jobs\jani -outdir:C:\etc\livegerber -workdir:C:\etc\workinggerber -step:pcb,top,bot,smt,smb,outline,sst,ssb -explode_all
