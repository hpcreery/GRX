// NODE
const fs = require('fs')
const path = require('path')
const process = require('process')
const util = require('util')
const { execSync, exec, spawn, spawnSync } = require('child_process')
var busboy = require('busboy')

// CONFIG
const { dir } = require('../config/config')

const odbdatabase = dir.odbdatabase
const db = dir.artworkdb

console.log('FILECONTROLLER: Local Gerber DB controller')

module.exports = {
  moduleInfo(req, res) {
    console.log('ODBINFO: info query:', req.query)
    res.status(200).send({ Query: req.query, Database: db })
  },

  getJobList(req, res) {
    search = req.query.search
    const isDirectory = (source) => fs.lstatSync(source).isDirectory()
    const searchFilter = (source) => {
      if (path.basename(source).search(search) !== -1) return true
    }
    const getDirectories = (source) =>
      fs
        .readdirSync(source)
        .map((name) => path.join(source, name))
        .filter(isDirectory)
        .filter(searchFilter)
        .map((dir) => ({ Name: path.basename(dir), Dir: dir }))
    try {
      jobs = getDirectories(db)
      res.status(200).send({ Database: db, Jobs: jobs })
    } catch (err) {
      console.log('ERROR:', err)
      res.status(500).send({ ERROR: err })
    }
  },

  createJob(req, res) {
    //console.log('Creating Dir Init', req)
    if (!req.query.job) {
      res.status(400).send('Need "job" object in Query')
      return
    }
    try {
      fs.mkdirSync(path.join(db, req.query.job))
      fs.mkdirSync(path.join(db, req.query.job, 'gerbers'))
    } catch (err) {
      console.log(err)
      res.status(500).send({ Status: 'Error', Message: 'Error Creating Directory' })
    }
    res.status(200).send({ Status: 'Done' })
  },

  uploadFiles(req, res) {
    if (!req.query.job) {
      res.status(400).send('Need "job" object in Query')
      return
    }
    if (!fs.existsSync(path.join(db, req.query.job, 'gerbers'))) {
      try {
        fs.mkdirSync(path.join(db, req.query.job, 'gerbers'))
        console.log('Making Directory')
      } catch (err) {
        console.log(err)
        res.status(500).send({ Status: 'Error', Message: 'Error Creating Directory' })
      }
    }
    var bus = new busboy({ headers: req.headers })

    bus.on('file', (fieldname, file, filename, encoding, mimetype) => {
      console.log('got a file!', filename, req.headers, fieldname, mimetype)
      //console.log(path.join(db, req.query.job, 'gerbers', filename))
      try {
        var saveTo = path.join(db, req.query.job, 'gerbers', filename)
        file.pipe(fs.createWriteStream(saveTo))
      } catch (err) {
        res.status(500).send({ Status: 'Error', Message: err })
      }
    })

    bus.on('finish', () => {
      res.status(200).send({ Status: 'Done' })
    })

    return req.pipe(bus)
    //res.status(200).send({ Status: 'Done')
  },

  getUploadedFiles(req, res) {
    if (!req.query.job) {
      res.status(400).send('Need "job" object in Query')
      return
    }
    let directory = path.join(db, req.query.job, 'gerbers')
    try {
      let files = fs.readdirSync(directory)
      let gerbernames = files.filter((file) => {
        var stats = fs.statSync(path.join(directory, file))
        if (stats.isFile()) {
          return true
        } else {
          return false
        }
      })
      res.status(200).send(gerbernames)
      return gerbernames
    } catch (err) {
      var error = 'Error parsing gerber directory: ' + directory + ' =>',
        err
      res.status(500).send(error)
    }
    return
  },

  deleteFile(req, res) {
    if (!req.query.job) {
      res.status(400).send('Need "job" object in Query')
      return
    }
    if (!req.query.filename) {
      res.status(400).send('Need "filename" object in Query')
      return
    }
    try {
      fs.unlinkSync(path.join(db, req.query.job, 'gerbers', req.query.filename))
    } catch (err) {
      console.log(err)
      res.status(500).send({ Status: 'Error', Message: 'Error Removing File' })
    }
    res.status(200).send({ Status: 'Done' })
  },

  deleteJob(req, res) {
    if (!req.query.job) {
      res.status(400).send('Need "job" object in Query')
      return
    }
    try {
      fs.rmdirSync(path.join(db, req.query.job), { recursive: true })
    } catch (err) {
      console.log(err)
      res.status(500).send({ Status: 'Error', Message: 'Error Removing Directory' })
    }
    res.status(200).send({ Status: 'Done' })
  },
}

// example cmdline execution
// ./odb2gbr_cmdlne64.exe -job:H:\test\jobs\jani -outdir:C:\etc\livegerber -workdir:C:\etc\workinggerber -step:pcb,top,bot,smt,smb,outline,sst,ssb -explode_all
