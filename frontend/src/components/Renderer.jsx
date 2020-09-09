// React
import React, { Component } from 'react';
import SideBar from './SideBar';

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

// Node
// const { remote, app } = window.require('electron');
// const fs = window.require('fs');
// const path = window.require('path');
// const { promisify } = window.require('util');
// const writeFile = promisify(fs.writeFile);
// no longer requiring node on the frontend

// TRACESPACE
const pcbStackup = require('pcb-stackup');

class Renderer extends Component {
  constructor(props) {
    super(props);
    this.state = { rendered: null };
  }

  // Three.js
  addObjectsFromDom = () => {
    // FRONT
    var element = document.getElementById('front-pcb');
    console.log(element);
    var div = new CSS3DObject(element);
    div.position.x = 0;
    div.position.y = 25;
    div.position.z = 1;
    this.cssScene.add(div);

    // BACK
    var element = document.getElementById('back-pcb');
    console.log(element);
    var div = new CSS3DObject(element);
    div.position.x = 0;
    div.position.y = 25;
    div.position.z = 0.5;
    this.cssScene.add(div);
  };

  cameraSelector = (type) => {
    console.log(type)
    if (type === 'perspective') {
      this.camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.01,
        1000
      );
      this.camera.position.z = 700;
      this.controls = new OrbitControls(this.camera, this.cssRenderer.domElement);
      this.controls.enableRotate = true;
    } else if (type === 'orthographic') {
      this.camera = new THREE.OrthographicCamera(
        window.innerWidth / -2,
        window.innerWidth / 2,
        window.innerHeight / 2,
        window.innerHeight / -2,
        1,
        1000
      );
      this.camera.position.z = 700;
      this.controls = new OrbitControls(this.camera, this.cssRenderer.domElement);
      this.controls.enableRotate = false;
    } else {
      console.log('unkown camera type:', type);
    }
  };

  setupScene = () => {
    var root = document.getElementById('root');

    console.log('init');

    var rendercontainer = document.getElementById('render-container');

    // Create Camera and set positions
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.01, 1000)
    // this.camera = new THREE.OrthographicCamera(
    //   window.innerWidth / -2,
    //   window.innerWidth / 2,
    //   window.innerHeight / 2,
    //   window.innerHeight / -2,
    //   1,
    //   1000
    // );
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
    //this.controls.enableRotate = false;

    // Other Three objects
    this.clock = new THREE.Clock();
    this.stats = new Stats();
    this.stats.domElement.classList.add('stats');
    root.appendChild(this.stats.dom);
    this.setState({ rendered: true });
  };

  onWindowResize = () => {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.cssRenderer.setSize(window.innerWidth, window.innerHeight);
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



  render() {
    console.log('Rendering Renderer');
    return <SideBar cameraSelector={(...props) => this.cameraSelector(...props)} />;
    // <div className='flip-card'>
    //   <div className='flip-card-inner'>
    //     <div className='flip-card-front' dangerouslySetInnerHTML={{ __html: this.topreturner() }}></div>
    //     <div className='flip-card-back' dangerouslySetInnerHTML={{ __html: this.botreturner() }}></div>
    //   </div>
    // </div>
  }

  componentDidMount() {
    this.setupScene();
    this.animationHandler();
    window.addEventListener('resize', this.onWindowResize, false);
    this.controls.update();
    //this.gerbeRender()
  }
}

export default Renderer;
