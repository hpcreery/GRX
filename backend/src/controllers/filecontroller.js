// NODE
import { lstatSync, readdirSync, mkdirSync, existsSync, createWriteStream, statSync, unlinkSync, rmdirSync } from 'fs'
import { basename, join } from 'path'
import busboy from 'busboy'

// CONFIG
import { dir } from '../config/config'

const db = dir.artworkdb

export function getJobList(req, res) {
  search = req.query.search
  const isDirectory = (source) => lstatSync(source).isDirectory()
  const searchFilter = (source) => {
    if (basename(source).search(search) !== -1)
      return true
  }
  const getDirectories = (source) => readdirSync(source)
    .map((name) => join(source, name))
    .filter(isDirectory)
    .filter(searchFilter)
    .map((dir) => ({ Name: basename(dir), Dir: dir }))
  try {
    jobs = getDirectories(db)
    res.status(200).send({ Database: db, Jobs: jobs })
  } catch (err) {
    console.log('ERROR:', err)
    res.status(500).send({ ERROR: err })
  }
}

export function createJob(req, res) {
  //console.log('Creating Dir Init', req)
  if (!req.query.job) {
    res.status(400).send('Need "job" object in Query')
    return
  }
  try {
    mkdirSync(join(db, req.query.job))
    mkdirSync(join(db, req.query.job, 'gerbers'))
  } catch (err) {
    console.log(err)
    res.status(500).send({ Status: 'Error', Message: 'Error Creating Directory' })
  }
  res.status(200).send({ Status: 'Done' })
}

export function uploadFiles(req, res) {
  if (!req.query.job) {
    res.status(400).send('Need "job" object in Query')
    return
  }
  if (!existsSync(join(db, req.query.job, 'gerbers'))) {
    try {
      mkdirSync(join(db, req.query.job, 'gerbers'))
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
      var saveTo = join(db, req.query.job, 'gerbers', filename)
      file.pipe(createWriteStream(saveTo))
    } catch (err) {
      res.status(500).send({ Status: 'Error', Message: err })
    }
  })

  bus.on('finish', () => {
    res.status(200).send({ Status: 'Done' })
  })

  return req.pipe(bus)
}

export function getUploadedFiles(req, res) {
  if (!req.query.job) {
    res.status(400).send('Need "job" object in Query')
    return
  }
  let directory = join(db, req.query.job, 'gerbers')
  try {
    let files = readdirSync(directory)
    let gerbernames = files.filter((file) => {
      var stats = statSync(join(directory, file))
      if (stats.isFile()) {
        return true
      } else {
        return false
      }
    })
    res.status(200).send(gerbernames)
    return gerbernames
  } catch (err) {
    var error = 'Error parsing gerber directory: ' + directory + ' =>', err
    res.status(500).send(error)
  }
  return
}

export function deleteFile(req, res) {
  if (!req.query.job) {
    res.status(400).send('Need "job" object in Query')
    return
  }
  if (!req.query.filename) {
    res.status(400).send('Need "filename" object in Query')
    return
  }
  try {
    unlinkSync(join(db, req.query.job, 'gerbers', req.query.filename))
  } catch (err) {
    console.log(err)
    res.status(500).send({ Status: 'Error', Message: 'Error Removing File' })
  }
  res.status(200).send({ Status: 'Done' })
}

export function deleteJob(req, res) {
  if (!req.query.job) {
    res.status(400).send('Need "job" object in Query')
    return
  }
  try {
    rmdirSync(join(db, req.query.job), { recursive: true })
  } catch (err) {
    console.log(err)
    res.status(500).send({ Status: 'Error', Message: 'Error Removing Directory' })
  }
  res.status(200).send({ Status: 'Done' })
}

