// NODE
import { readFile, readdirSync, statSync, createReadStream } from 'fs'
import { join } from 'path'
import process from 'process'
import { promisify } from 'util'
import { execSync, exec, spawn, spawnSync } from 'child_process'

// MODULES
import pcbStackup from 'pcb-stackup'
import gerberToSVG from 'gerber-to-svg'
import whatsThatGerber from '../sourced/whats-that-gerber/index'

// CONFIG
import { dir } from '../config/config'
import { Console } from 'console'

// PROMISE
readFilePromise = promisify(readFile)
gerberToSVGPromise = promisify(gerberToSVG)

console.log('GBR2SVG: converting .gbr to .svg')

logger = (put) => {
  console.log(put)
}

finishedConverter = () => {}

layerConverter = async (dir) => {
  try {
    gerberString = await readFilePromise(dir, { encoding: 'utf8' })
    svg = await gerberToSVGPromise(gerberString)
  } catch (err) {
    console.error('Error converting gerber layer ' + dir, err)
    throw err
  }

  //console.log(svg);
  return svg
}

gerberNamesFilter = (directory) => {
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
    return gerbernames
  } catch (err) {
    throw ('Error parsing gerber directory: ' + directory + ' =>', err)
  }
}

export function moduleInfo(req, res) {
  console.log('GBR2SVG info query:', req.query)
  res.status(200).send({ query: req.query })
}
export async function getLayerArtwork(req, res) {
  console.log('QUERY PARAMS:', req.query)
  if (!req.query.job) {
    res.status(400).send('Need "job" object in Query')
    return
  }
  // let directory = path.join(
  //   dir.odbdatabase,
  //   req.query.job,
  //   dir.odbgerboutdir
  // );
  let directory = join(dir.artworkdb, req.query.job, 'gerbers')

  try {
    if (req.query.layer) {
      gerbernames = [req.query.layer]
    } else {
      gerbernames = gerberNamesFilter(directory)
    }

    var gerbertypes = await whatsThatGerber(gerbernames)
    console.log(gerbertypes)
  } catch (err) {
    console.log(err)
    res.status(500).send('Server Error =>' + err)
  }
  console.log(gerbernames.length)
  if (gerbernames.length == 0) {
    console.log('no gerbers')
    res.status(500).send('No Gerber Data Found')
    return
  }
  try {
    var convertedGerbers = await Promise.all(
      gerbernames.map(async (gerbername) => {
        return {
          name: gerbername,
          type: gerbertypes[gerbername].type,
          side: gerbertypes[gerbername].side,
          svg: await layerConverter(join(directory, gerbername)),
        }
      })
    )
  } catch (err) {
    console.log('Error converting layers')
    res.status(500).send('Server Error converting gerber to image =>' + err)
  }
  res.status(200).send(convertedGerbers)
  return convertedGerbers
}
export async function getFinishedArtwork(req, res) {
  console.log('QUERY PARAMS:', req.query)
  if (!req.query.job) {
    res.status(400).send('Need "job" object in Query')
    return
  }
  // let directory = path.join(
  //   dir.odbdatabase,
  //   req.query.job,
  //   dir.odbgerboutdir
  // );
  let directory = join(dir.artworkdb, req.query.job, 'gerbers')
  // This is depreciated due to use of outline when rendering finished artwork.
  // let cache = path.join(dir.artworkdb, req.query.job, 'cache')
  // if (fs.existsSync(cache)) {
  //   // res.status(200).send('found cached data')
  //   let cachedGerbers = fs.readFileSync(path.join(cache, 'finishedArtwork.json'))
  //   res.status(200).send(JSON.parse(cachedGerbers))
  //   return
  // }
  try {
    gerbernames = gerberNamesFilter(directory)
    var gerbertypes = await whatsThatGerber(gerbernames)
    console.log(gerbertypes)
  } catch (err) {
    console.log(err)
    res.status(500).send('Server Error =>' + err)
  }
  if (gerbernames.length == 0) {
    console.log('no gerbers')
    res.status(500).send('No Gerber Data Found')
    return
  }
  try {
    var layers = gerbernames.map((name) => ({
      filename: name,
      type: gerbertypes[name].type,
      side: gerbertypes[name].side,
      gerber: createReadStream(join(directory, name)),
    }))
    var svgstackup = await pcbStackup(layers, { useOutline: req.query.outline == 'true' })
  } catch (err) {
    console.log(err)
    res.status(500).send('Server Error converting gerber to image =>' + err)
  }
  var toplayer = svgstackup.top.svg
  var botlayer = svgstackup.bottom.svg
  convertedGerbers = [
    {
      name: 'front',
      type: 'finished',
      side: 'top',
      svg: toplayer,
    },
    {
      name: 'back',
      type: 'finished',
      side: 'bottom',
      svg: botlayer,
    },
  ]
  // See Comment on cache variable
  // try {
  //   fs.mkdirSync(cache)
  //   fs.writeFileSync(path.join(cache, 'finishedArtwork.json'), JSON.stringify(convertedGerbers))
  // } catch (err) {
  //   console.log('Could not write cache file... continue')
  //   console.log(err)
  // }
  res.status(200).send(convertedGerbers)
  return convertedGerbers
}
export async function getLayerList(req, res) {
  console.log('QUERY PARAMS:', req.query)
  if (!req.query.job) {
    res.status(400).send('Need "job" object in Query')
    return
  }
  // let directory = path.join(
  //   dir.odbdatabase,
  //   req.query.job,
  //   dir.odbgerboutdir
  // );
  let directory = join(dir.artworkdb, req.query.job, 'gerbers')
  try {
    gerbernames = gerberNamesFilter(directory)
    var gerbertypes = await whatsThatGerber(gerbernames)
    console.log(gerbertypes)
  } catch (err) {
    console.log(err)
    res.status(500).send('Server Error =>' + err)
  }
  try {
    var layers = gerbernames.map((name) => ({
      name: name,
      type: gerbertypes[name].type,
      side: gerbertypes[name].side,
      svg: '',
    }))
  } catch (err) {
    console.log(err)
    res.status(500).send('Server Error =>' + err)
  }
  res.status(200).send(layers)
  return layers
}
