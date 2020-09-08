// Node
const fs = require('fs')
const path = require('path')
const process = require('process')
const util = require('util')
const { execSync, exec, spawn, spawnSync } = require('child_process')
const dotenv = require('dotenv')
dotenv.config()

const converterpath = process.env.ODB2GBR //process.env.ODB2GBR ? process.env.ODB2GBR : or process.cwd() // for current directory
console.log('ODB2GBR is here: ', converterpath)
console.log('ODB2GBR: extracting gerber from ODB++')

module.exports = {
  testModule(req, res) {
    console.log('ODB2GBR test:', req.query)
    res.status(200).send(req.query)
  },

  getGerberData(req, res) {
    //spawn
  },

  getStepList(req, res) {},

  isJobReal(req, res) {},
}

// export default class ODB2GBR {
//   constructor() {
//     database = 'H:\\jobs\\main\\'
//     this.converterpath = process.env.ODB2GBR // or process.cwd() for current directory
//     console.log('ODB2GBR is here: ', this.converterpath)
//     console.log('ODB2GBR: extracting gerber from ODB++')
//   }

//   getGerberData = (job, dest) => {
//     //spawn
//   }

//   getStepList = (job) => {}

//   isJobReal = (job) => {}
// }

// example cmdline execution
// ./odb2gbr_cmdlne64.exe -job:H:\test\jobs\jani -outdir:C:\etc\livegerber -workdir:C:\etc\workinggerber -step:pcb,top,bot,smt,smb,outline,sst,ssb -explode_all
