// React
import React, { Component } from 'react'
import SideBar from './SideBar'

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
// no longer requiring node on the frontend

// TRACESPACE
const pcbStackup = require('pcb-stackup')

class Renderer extends Component {
  constructor(props) {
    super(props)
    this.state = { rendered: null, CSS3DObjects: [] }
  }

  CSS3DObjects = []

  // Three.js
  addInitSVGFromDom = () => {
    // FRONT
    var element = document.getElementById('front-pcb')
    console.log(element)
    this.frontPCBObject = new CSS3DObject(element)
    this.frontPCBObject.name = 'front-pcb'
    this.frontPCBObject.position.x = 0
    this.frontPCBObject.position.y = 25
    this.frontPCBObject.position.z = 1
    this.cssScene.add(this.frontPCBObject)

    // BACK
    var element = document.getElementById('back-pcb')
    console.log(element)
    this.backPCBObject = new CSS3DObject(element)
    this.backPCBObject.name = 'back-pcb'
    this.backPCBObject.position.x = 0
    this.backPCBObject.position.y = 25
    this.backPCBObject.position.z = 0.5
    this.cssScene.add(this.backPCBObject)

    this.setState({ CSS3DObjects: [this.frontPCBObject, this.backPCBObject] })
  }

  // High Level Absraction Methods
  addLayer = (layer) => {
    // layer = {name: '', type: '', side: '', svg: ''}
    var svgElement = document.createElement('div')
    svgElement.id = layer.name
    svgElement.setAttribute('data-type', layer.type)
    svgElement.setAttribute('data-side', layer.side)
    svgElement.innerHTML = layer.svg
    this.addSVGObject(svgElement)
  }

  removeLayer = (layer) => {
    this.removeCSS3DObject(layer.name)
  }

  // Low Level Abstraction Methods
  addSVGObject = (SVGObject) => {
    console.log('Adding SVG Object ', SVGObject)
    var newCSS3DObject = new CSS3DObject(SVGObject)
    newCSS3DObject.name = SVGObject.id
    this.cssScene.add(newCSS3DObject)
    this.setState({ CSS3DObjects: this.cssScene.children })
  }

  // addSVGObjects = (SVGObjects) => {
  //   SVGObjects.forEach((SVGObject) => {
  //     console.log('Adding SVG Object ', SVGObject)
  //     var newCSS3DObject = new CSS3DObject(SVGObject)
  //     newCSS3DObject.name = SVGObject.id
  //     this.cssScene.add(newCSS3DObject)
  //   })
  //   this.setState({ CSS3DObjects: this.cssScene.children })
  // }

  // addCSS3DObjects = (CSS3DObjects) => {
  //   CSS3DObjects.forEach((object) => {
  //     console.log('adding', object)
  //     this.cssScene.add(object)
  //   })
  //   this.setState({ CSS3DObjects: this.cssScene.children })
  // }

  removeCSS3DObject = (name) => {
    this.cssScene.remove(this.state.CSS3DObjects.find((x) => x.name === name))
    this.setState({ CSS3DObjects: this.cssScene.children })
  }

  removeAllCSS3DObjects = () => {
    this.state.CSS3DObjects.forEach((child) => {
      console.log('removing', child)
      this.cssScene.remove(child)
    })
    this.setState({ CSS3DObjects: this.cssScene.children })
  }

  updateCSSObjects = () => {
    var children = this.cssScene.children
    children.forEach((child) => {
      this.cssScene.remove(child)
    })
    this.state.CSS3DObjects.forEach((object) => {
      this.cssScene.add(object)
    })
  }

  // Camera type switcher
  cameraSelector = (type) => {
    console.log(type)
    if (type === 'perspective') {
      this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.01, 1000)
      this.camera.position.z = 700
      this.controls = new OrbitControls(this.camera, this.cssRenderer.domElement)
      this.controls.enableRotate = true
      this.controls.enableZoom = true
    } else if (type === 'orthographic') {
      this.camera = new THREE.OrthographicCamera(
        window.innerWidth / -2,
        window.innerWidth / 2,
        window.innerHeight / 2,
        window.innerHeight / -2,
        1,
        1000
      )
      this.camera.position.z = 700
      this.controls = new OrbitControls(this.camera, this.cssRenderer.domElement)
      this.controls.enableRotate = false
      this.controls.enableZoom = false
    } else {
      console.log('unkown camera type:', type)
    }
  }

  setupScene = () => {
    var root = document.getElementById('root')

    console.log('init')

    var rendercontainer = document.getElementById('render-container')

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
    this.camera.position.z = 700
    this.camera.lookAt(new THREE.Vector3(0, 0, 0))

    // Create Scene
    this.cssScene = new THREE.Scene()

    // Create Renderer
    this.cssRenderer = new CSS3DRenderer()
    this.cssRenderer.setSize(window.innerWidth, window.innerHeight)
    rendercontainer.appendChild(this.cssRenderer.domElement)
    this.cssRenderer.domElement.id = 'css-renderer'
    this.svgContainer = this.cssRenderer.domElement.childNodes[0]
    this.svgContainer.id = 'svg-container'

    // Outer Method to add objects to dom
    this.addInitSVGFromDom()

    // Use orbit controls on renderer
    this.controls = new OrbitControls(this.camera, this.cssRenderer.domElement)
    //this.controls.enableRotate = false;

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

  render() {
    console.log('Rendering Renderer')
    return (
      <div style={{ height: '100%' }}>
        <SideBar
          cameraSelector={(...props) => this.cameraSelector(...props)}
          addLayer={(layer) => this.addLayer(layer)}
          removeLayer={(layer) => this.removeLayer(layer)}
          clear={() => this.removeAllCSS3DObjects()}
          update={() => this.updateCSSObjects()}
        />
      </div>
    )
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
  componentDidUpdate() {
    //this.addCSS3DObjectsFromState()
    console.log(this.state)
  }
}

export default Renderer
