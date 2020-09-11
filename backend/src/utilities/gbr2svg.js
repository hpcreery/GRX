// NODE
const fs = require('fs');
const path = require('path');
const process = require('process');
const util = require('util');
const { execSync, exec, spawn, spawnSync } = require('child_process');

// MODULES
const pcbStackup = require('pcb-stackup');
const gerberToSVG = require('gerber-to-svg');
const whatsThatGerber = require('../sourced/whats-that-gerber/index');

// CONFIG
const { dir, stackup } = require('../config/config');
const { Console } = require('console');

// PROMISE
readFilePromise = util.promisify(fs.readFile);
gerberToSVGPromise = util.promisify(gerberToSVG);

console.log('GBR2SVG: converting .gbr to .svg');

logger = (put) => {
  console.log(put);
};

finishedConverter = () => {};

layerConverter = async (dir) => {
  try {
    gerberString = await readFilePromise(dir, { encoding: 'utf8' });
    svg = await gerberToSVGPromise(gerberString);
  } catch (err) {
    console.error('Error converting gerber layer ' + dir, err);
    throw err;
  }

  //console.log(svg);
  return svg;
};

gerberNamesFilter = (directory) => {
  let files = fs.readdirSync(directory);
  let gerbernames = files.filter((file) => {
    var stats = fs.statSync(path.join(directory, file));
    if (stats.isFile()) {
      return true;
    } else {
      return false;
    }
  });
  return gerbernames;
};

module.exports = {
  moduleInfo(req, res) {
    console.log('GBR2SVG info query:', req.query);
    res.status(200).send({ query: req.query });
  },

  // req = { job: XXX }
  async getExampleSVG(req, res) {
    console.log('QUERY PARAMS:', req.query);
    if (!req.query.job) {
      res.status(400).send('Need "job" object in Query');
      return;
    }
    let files = fs.readdirSync(path.join(dir.example, req.query.job));
    let gerbers = files.filter((file) => {
      var stats = fs.statSync(path.join(dir.example, req.query.job, file));
      if (stats.isFile()) {
        return true;
      } else {
        return false;
      }
    });

    try{
      var gerbertypes = await whatsThatGerber(gerbernames);
      console.log(gerbertypes);
    } catch(err) {
      console.log(err)
    }

    var layers = gerbers.map((filename) => ({
      filename,
      type: gerbertypes[filename].type,
      side: gerbertypes[filename].side,
      gerber: fs.createReadStream(
        path.join(dir.example, req.query.job, filename)
      ),
    }));

    try {
      var svgstackup = await pcbStackup(layers, { useOutline: true });
    } catch (err) {
      res.status(500).send('Internal Error converting gerber to SVG:', err);
    }

    // TODO: add more info from svgstackup into response
    //console.log('STACKUP:', svgstackup);
    // toplayer = svgstackup.top.svg;
    // botlayer = svgstackup.bottom.svg;

    res.status(200).send({
      query: req.query,
      gerbers: gerbers,
      toplayer: svgstackup.top.svg,
      botlayer: svgstackup.bottom.svg,
    });
    return;
  },

  doesSVGExist(req, res) {},

  async getLayerArtwork(req, res) {
    console.log('QUERY PARAMS:', req.query);
    if (!req.query.job) {
      res.status(400).send('Need "job" object in Query');
      return;
    }
    let directory = path.join(
      dir.odbdatabase,
      req.query.job,
      dir.odbgerboutdir
    );
    gerbernames = gerberNamesFilter(directory);
    try{
      var gerbertypes = await whatsThatGerber(gerbernames);
      console.log(gerbertypes);
    } catch(err) {
      console.log(err)
    }
    try {
      var convertedGerbers = await Promise.all(
        gerbernames.map(async (gerbername) => {
          return {
            layer: gerbername,
            type: gerbertypes[gerbername].type,
            side: gerbertypes[gerbername].side,
            svg: await layerConverter(path.join(directory, gerbername)),
          };
        })
      );
      console.log(convertedGerbers);
    } catch (err) {
      console.log('Error converting layers');
      res.status(500).send('Internal Error converting gerber to SVG:', err);
    }
    res.status(200).send(convertedGerbers);
    return convertedGerbers;
  },

  async getFinishedArtwork(req, res) {
    console.log('QUERY PARAMS:', req.query);
    if (!req.query.job) {
      res.status(400).send('Need "job" object in Query');
      return;
    }
    let directory = path.join(
      dir.odbdatabase,
      req.query.job,
      dir.odbgerboutdir
    );
    gerbernames = gerberNamesFilter(directory);

    try{
      var gerbertypes = await whatsThatGerber(gerbernames);
      console.log(gerbertypes);
    } catch(err) {
      console.log(err)
    }

    var layers = gerbernames.map((filename) => ({
      filename,
      type: gerbertypes[filename].type,
      side: gerbertypes[filename].side,
      gerber: fs.createReadStream(path.join(directory, filename)),
    }));
    try {
      var svgstackup = await pcbStackup(layers, { useOutline: true });
    } catch (err) {
      res.status(500).send('Internal Error converting gerber to SVG:', err);
    }

    //console.log('STACKUP:', svgstackup);
    //console.log(stackup.bottom.svg) // logs "<svg ... </svg>"
    //console.log(stackup.bottom.svg) // logs "<svg ... </svg>"
    toplayer = svgstackup.top.svg;
    botlayer = svgstackup.bottom.svg;

    res.status(200).send({
      query: req.query,
      gerbers: gerbernames,
      toplayer: toplayer,
      botlayer: botlayer,
    });
  },

  getFinalSVG(req, res) {},

  isGerberReady(req, res) {},
};
