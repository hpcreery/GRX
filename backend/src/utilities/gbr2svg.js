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

//this.gerbeRender();
// this.renderStackup()
//   .then(this.writeStackup)
//   .then(() => console.log(`Wrote:\n  ${TOP_OUT}\n  ${BOTTOM_OUT}`))
//   .catch((error) => console.error('Error rendering stackup', error));
// }

// Pure CSS
// gerbeRender = () => {
//   console.log('Initialting Method gerberRender()');
//   const fileNames = [
//     './public/ArduinoGerbers/UNO.GTL',
//     './public/ArduinoGerbers/UNO.GTS',
//     './public/ArduinoGerbers/UNO.GTO',
//     './public/ArduinoGerbers/UNO.GTP',
//     './public/ArduinoGerbers/UNO.GBL',
//     './public/ArduinoGerbers/UNO.GBS',
//     './public/ArduinoGerbers/UNO.GBO',
//     './public/ArduinoGerbers/UNO.GBP',
//     './public/ArduinoGerbers/UNO.GML',
//     './public/ArduinoGerbers/UNO.dri',
//     './public/ArduinoGerbers/UNO.brd',
//   ];

//   const layers = fileNames.map((filename) => ({
//     filename,
//     gerber: fs.createReadStream(filename),
//   }));

//   pcbStackup(layers, { useOutline: true }).then((stackup) => {
//     console.log(stackup);
//     console.log(stackup.bottom.svg); // logs "<svg ... </svg>"
//     //console.log(stackup.bottom.svg) // logs "<svg ... </svg>"
//     this.toplayer = stackup.top.svg;
//     this.botlayer = stackup.bottom.svg;
//     this.setState({ rendered: true });
//     document.body.appendChild(this.toplayer);
//   });
// };

// stringToHTML = (str) => {
//   var parser = new DOMParser();
//   var doc = parser.parseFromString(str, 'text/html');
//   return doc.body;
// };

// topreturner = () => {
//   return this.state.rendered ? this.toplayer : '<span>LOADING</span>';
// };
// botreturner = () => {
//   return this.state.rendered ? this.botlayer : '<span>LOADING</span>';
// };

// GERBER_FILENAMES = [
//   '1dr.gbr',
//   '2dr.gbr',
//   'bot.gbr',
//   'top.gbr',
//   'smt.gbr',
//   'smb.gbr',
//   'sst.gbr',
// ];

// renderStackup() {
//   const layers = this.GERBER_FILENAMES.map((filename) => ({
//     filename,
//     gerber: fs.createReadStream(path.join(GERBERS_DIR, filename)),
//   }));

//   return pcbStackup(layers);
// }

// writeStackup(stackup) {
//   console.log(stackup);
//   return Promise.all([
//     writeFile(TOP_OUT, stackup.top.svg),
//     writeFile(BOTTOM_OUT, stackup.bottom.svg),
//   ]);
// }
