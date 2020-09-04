// React
import React, { Component } from 'react';

// ANT DESIGN UI
import { Spin, Switch, Alert, Button, Card } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

// THREE
import * as THREE from '../three/build/three.module.js';
import { OrbitControls } from '../three/examples/jsm/controls/OrbitControls.js';
import {
  CSS3DRenderer,
  CSS3DObject,
} from '../three/examples/jsm/renderers/CSS3DRenderer.js';
import Stats from '../three/examples/jsm/libs/stats.module.js';

// NODE
const fs = window.require('fs');

// TRACESPACE
const pcbStackup = require('pcb-stackup');

class Renderer extends Component {
  constructor(props) {
    super(props);
    this.state = { rendered: null };
  }
  gerbeRender = () => {
    console.log('Initialting Method gerberRender()');
    const fileNames = [
      '././public/ArduinoGerbers/UNO.GTL',
      '././public/ArduinoGerbers/UNO.GTS',
      '././public/ArduinoGerbers/UNO.GTO',
      '././public/ArduinoGerbers/UNO.GTP',
      '././public/ArduinoGerbers/UNO.GBL',
      '././public/ArduinoGerbers/UNO.GBS',
      '././public/ArduinoGerbers/UNO.GBO',
      '././public/ArduinoGerbers/UNO.GBP',
      '././public/ArduinoGerbers/UNO.GML',
      '././public/ArduinoGerbers/UNO.dri',
      '././public/ArduinoGerbers/UNO.brd',
    ];

    const layers = fileNames.map((filename) => ({
      filename,
      gerber: fs.createReadStream(filename),
    }));

    pcbStackup(layers, { useOutline: true }).then((stackup) => {
      console.log(stackup);
      console.log(stackup.bottom.svg); // logs "<svg ... </svg>"
      //console.log(stackup.bottom.svg) // logs "<svg ... </svg>"
      this.toplayer = stackup.top.svg;
      this.botlayer = stackup.bottom.svg;
      this.setState({ rendered: true });
    });
  };

  stringToHTML = (str) => {
    var parser = new DOMParser();
    var doc = parser.parseFromString(str, 'text/html');
    return doc.body;
  };

  topreturner = () => {
    return this.state.rendered ? this.toplayer : '<span>LOADING</span>';
  };
  botreturner = () => {
    return this.state.rendered ? this.botlayer : '<span>LOADING</span>';
  };

  addObjectsFromDom = () => {
    // FRONT
    var element = document.getElementById('front-pcb');
    console.log(element);
    // var element = document.createElement('div');
    // element.innerHTML = 'text';
    // element.style.background = "#0094ff";
    // element.style.color = "white";
    // element.style.padding = "2px";
    // element.style.border = "0px";
    // element.style.margin = "0px";
    var div = new CSS3DObject(element);
    div.position.x = 0;
    div.position.y = 25;
    div.position.z = 1;
    this.cssScene.add(div);

    // BACK
    var element = document.getElementById('back-pcb');
    console.log(element);
    // var element = document.createElement('div');
    // element.innerHTML = 'text';
    // element.style.background = "#0094ff";
    // element.style.color = "white";
    // element.style.padding = "2px";
    // element.style.border = "0px";
    // element.style.margin = "0px";
    var div = new CSS3DObject(element);
    div.position.x = 0;
    div.position.y = 25;
    div.position.z = 0.7;
    this.cssScene.add(div);
  };

  setupScene = () => {
    console.log('init');

    var rendercontainer = document.getElementById('render-container');

    // Create Camera and set positions
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.01,
      1000
    );
    this.camera.position.z = 700;
    this.camera.lookAt(new THREE.Vector3(0, 0, 0));

    // Create Scene
    this.cssScene = new THREE.Scene();

    // Create Renderer
    this.cssRenderer = new CSS3DRenderer();
    this.cssRenderer.setSize(window.innerWidth, window.innerHeight);
    rendercontainer.appendChild(this.cssRenderer.domElement);

    // Outer Method to add objects to dom
    this.addObjectsFromDom();

    // Use orbit controls on renderer
    this.controls = new OrbitControls(this.camera, this.cssRenderer.domElement);

    // Other Three objects
    this.clock = new THREE.Clock();
    this.stats = new Stats();
    document.body.appendChild(this.stats.dom);
  };

  onWindowResize = () => {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(window.innerWidth, window.innerHeight);
  };

  animationHandler = () => {
    //var elapsed = this.clock.getElapsedTime()
    //var delta = this.clock.getDelta()
    // controls.update()
    // renderer.render(scene, camera)
    this.cssRenderer.render(this.cssScene, this.camera);
    this.stats.update();

    requestAnimationFrame(this.animationHandler);
  };

  // componentDidMount() {
  //   //this.gerbeRender()
  // }

  render() {
    console.log('Rendering Renderer');
    return (
      <div>
        <Card title="test">
          <Button onClick={() => console.log('clicked')}>Hello</Button>
        </Card>
      </div>
      // <div className='flip-card'>
      //   <div className='flip-card-inner'>
      //     <div className='flip-card-front' dangerouslySetInnerHTML={{ __html: this.topreturner() }}></div>
      //     <div className='flip-card-back' dangerouslySetInnerHTML={{ __html: this.botreturner() }}></div>
      //   </div>
      // </div>
    );
  }

  componentDidMount() {
    this.setupScene();
    this.animationHandler();
    window.addEventListener('resize', this.onWindowResize, false);
    this.controls.update();
  }
}

export default Renderer;
