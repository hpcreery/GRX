// NODE
const fs = require('fs');
const path = require('path');
const process = require('process');
const util = require('util');
const { execSync, exec, spawn, spawnSync } = require('child_process');

// CONFIG
const { dir } = require('../config/config');

const odbdatabase = dir.odbdatabase;

console.log('ODBINFO: ODB++ database info');

module.exports = {
  moduleInfo(req, res) {
    console.log('ODBINFO: info query:', req.query);
    res.status(200).send({ Query: req.query, Database: odbdatabase });
  },

  getJobList(req, res) {
    search = req.query.search;
    const isDirectory = (source) => fs.lstatSync(source).isDirectory();
    const searchFilter = (source) => {
      if (path.basename(source).search(search) !== -1) return true;
    };
    const getDirectories = (source) =>
      fs
        .readdirSync(source)
        .map((name) => path.join(source, name))
        .filter(isDirectory)
        .filter(searchFilter)
        .map((dir) => ({ Job: path.basename(dir), Dir: dir }));
    try {
      jobs = getDirectories(odbdatabase);
      res.status(200).send({ Database: odbdatabase, Jobs: jobs });
    } catch (err) {
      console.log('ERROR:', err);
      res.status(500).send({ ERROR: err });
    }
  },

  getJobSteps(req, res) {},

  isJobReal(req, res) {},
};

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
