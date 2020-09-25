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
  try {
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
  } catch (err) {
    throw ('Error parsing gerber directory: ' + directory + ' =>', err);
  }
};

module.exports = {
  moduleInfo(req, res) {
    console.log('GBR2SVG info query:', req.query);
    res.status(200).send({ query: req.query });
  },

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

    try {
      if (req.query.layer) {
        gerbernames = [req.query.layer];
      } else {
        gerbernames = gerberNamesFilter(directory);
      }

      var gerbertypes = await whatsThatGerber(gerbernames);
      console.log(gerbertypes);
    } catch (err) {
      console.log(err);
      res.status(500).send('Server Error =>' + err);
    }
    console.log(gerbernames.length)
    if (gerbernames.length == 0) {
      console.log('no gerbers')
      res.status(500).send('No Gerber Data Found');
      return
    }
    try {
      var convertedGerbers = await Promise.all(
        gerbernames.map(async (gerbername) => {
          return {
            name: gerbername,
            type: gerbertypes[gerbername].type,
            side: gerbertypes[gerbername].side,
            svg: await layerConverter(path.join(directory, gerbername)),
          };
        })
      );
      //console.log(convertedGerbers)
    } catch (err) {
      console.log('Error converting layers');
      res.status(500).send('Server Error converting gerber to image =>' + err);
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
    try {
      gerbernames = gerberNamesFilter(directory);
      var gerbertypes = await whatsThatGerber(gerbernames);
      console.log(gerbertypes);
    } catch (err) {
      console.log(err);
      res.status(500).send('Server Error =>' + err);
    }
    if (gerbernames.length == 0) {
      console.log('no gerbers')
      res.status(500).send('No Gerber Data Found');
      return
    }
    try {
      var layers = gerbernames.map((name) => ({
        filename: name,
        type: gerbertypes[name].type,
        side: gerbertypes[name].side,
        gerber: fs.createReadStream(path.join(directory, name)),
      }));
      var svgstackup = await pcbStackup(layers, { useOutline: false });
    } catch (err) {
      console.log(err);
      res.status(500).send('Server Error converting gerber to image =>' + err);
    }
    var toplayer = svgstackup.top.svg;
    var botlayer = svgstackup.bottom.svg;
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
    ];
    res.status(200).send(convertedGerbers);
    return convertedGerbers;
  },

  async getLayerList(req, res) {
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
    try {
      gerbernames = gerberNamesFilter(directory);
      var gerbertypes = await whatsThatGerber(gerbernames);
      console.log(gerbertypes);
    } catch (err) {
      console.log(err);
      res.status(500).send('Server Error =>' + err);
    }
    try {
      var layers = gerbernames.map((name) => ({
        name: name,
        type: gerbertypes[name].type,
        side: gerbertypes[name].side,
        svg: '',
      }));
    } catch (err) {
      console.log(err);
      res.status(500).send('Server Error =>' + err);
    }
    res.status(200).send(layers);
    return layers;
  },

  getFinalSVG(req, res) {},

  isGerberReady(req, res) {},

  doesSVGExist(req, res) {},

  // async getExampleSVG(req, res) {
  //   console.log('QUERY PARAMS:', req.query)
  //   if (!req.query.job) {
  //     res.status(400).send('Need "job" object in Query')
  //     return
  //   }
  //   let directory = path.join(dir.example, req.query.job)
  //   try {
  //     gerbernames = gerberNamesFilter(directory)
  //     var gerbertypes = await whatsThatGerber(gerbernames)
  //     console.log(gerbertypes)
  //   } catch (err) {
  //     console.log('Internal Error =>', err)
  //     res.status(500).send('Internal Error => ' + err)
  //   }

  //   try {
  //     var layers = gerbernames.map((filename) => ({
  //       filename,
  //       type: gerbertypes[filename].type,
  //       side: gerbertypes[filename].side,
  //       gerber: fs.createReadStream(path.join(directory, filename)),
  //     }))
  //     var svgstackup = await pcbStackup(layers, { useOutline: true })
  //   } catch (err) {
  //     console.log('Internal Error converting gerber to SVG =>', err)
  //     res.status(500).send('Internal Error converting gerber to SVG =>' + err)
  //   }

  //   // TODO: add more info from svgstackup into response
  //   //console.log('STACKUP:', svgstackup);
  //   // toplayer = svgstackup.top.svg;
  //   // botlayer = svgstackup.bottom.svg;

  //   res.status(200).send({
  //     query: req.query,
  //     gerbers: gerbernames,
  //     toplayer: svgstackup.top.svg,
  //     botlayer: svgstackup.bottom.svg,
  //   })
  //   return
  // },
};
