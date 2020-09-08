// React
import React, { Component } from 'react'

// ANT DESIGN UI
import { Spin, Switch, Alert, Button, Card } from 'antd'
import { LoadingOutlined } from '@ant-design/icons'

// THREE
import * as THREE from '../three/build/three.module.js'
import { OrbitControls } from '../three/examples/jsm/controls/OrbitControls.js'
import { CSS3DRenderer, CSS3DObject } from '../three/examples/jsm/renderers/CSS3DRenderer.js'
import Stats from '../three/examples/jsm/libs/stats.module.js'

// Node
// const { remote, app } = window.require('electron');
// const fs = window.require('fs');
// const path = window.require('path');
// const { promisify } = window.require('util');
// const writeFile = promisify(fs.writeFile);

// TRACESPACE
const pcbStackup = require('pcb-stackup')

// Other Constants
// const GERBERS_DIR = 0// = path.join(remote.app.getAppPath(), '/public/test');
// const TOP_OUT = 0// = path.join(remote.app.getAppPath(), 'example_top.svg');
// const BOTTOM_OUT = 0// = path.join(remote.app.getAppPath(), 'example_bot.svg');

class Renderer extends Component {
  constructor(props) {
    super(props)
    this.state = { rendered: null }
    //this.gerbeRender();
    // this.renderStackup()
    //   .then(this.writeStackup)
    //   .then(() => console.log(`Wrote:\n  ${TOP_OUT}\n  ${BOTTOM_OUT}`))
    //   .catch((error) => console.error('Error rendering stackup', error));
  }

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

  // Three=.js

  addObjectsFromDom = () => {
    // FRONT
    var element = document.getElementById('front-pcb')
    console.log(element)
    var div = new CSS3DObject(element)
    div.position.x = 0
    div.position.y = 25
    div.position.z = 1
    this.cssScene.add(div)

    // BACK
    var element = document.getElementById('back-pcb')
    console.log(element)
    var div = new CSS3DObject(element)
    div.position.x = 0
    div.position.y = 25
    div.position.z = 0.7
    this.cssScene.add(div)
  }

  setupScene = () => {
    var root = document.getElementById('root')

    console.log('init')

    var rendercontainer = document.getElementById('render-container')

    // Create Camera and set positions
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.01, 1000)
    this.camera.position.z = 700
    this.camera.lookAt(new THREE.Vector3(0, 0, 0))

    // Create Scene
    this.cssScene = new THREE.Scene()

    // Create Renderer
    this.cssRenderer = new CSS3DRenderer()
    this.cssRenderer.setSize(window.innerWidth, window.innerHeight)
    rendercontainer.appendChild(this.cssRenderer.domElement)

    // Outer Method to add objects to dom
    this.addObjectsFromDom()

    // Use orbit controls on renderer
    this.controls = new OrbitControls(this.camera, this.cssRenderer.domElement)

    // Other Three objects
    this.clock = new THREE.Clock()
    this.stats = new Stats()
    this.stats.domElement.classList.add('stats')
    root.appendChild(this.stats.dom)
    this.setState({ rendered: true })
  }

  onWindowResize = () => {
    this.camera.aspect = window.innerWidth / window.innerHeight
    this.camera.updateProjectionMatrix()
    this.cssRenderer.setSize(window.innerWidth, window.innerHeight)
  }

  animationHandler = () => {
    //var elapsed = this.clock.getElapsedTime()
    //var delta = this.clock.getDelta()
    // controls.update()
    // renderer.render(scene, camera)
    this.cssRenderer.render(this.cssScene, this.camera)
    this.stats.update()

    requestAnimationFrame(this.animationHandler)
  }

  // componentDidMount() {
  //   //this.gerbeRender()
  // }

  render() {
    console.log('Rendering Renderer')
    return <div></div>
    // <div className='flip-card'>
    //   <div className='flip-card-inner'>
    //     <div className='flip-card-front' dangerouslySetInnerHTML={{ __html: this.topreturner() }}></div>
    //     <div className='flip-card-back' dangerouslySetInnerHTML={{ __html: this.botreturner() }}></div>
    //   </div>
    // </div>
  }

  componentDidMount() {
    this.setupScene()
    this.animationHandler()
    window.addEventListener('resize', this.onWindowResize, false)
    this.controls.update()
    //this.gerbeRender()
  }
}

export default Renderer
