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

// FUNCTIONAL
import MouseTracker from './functional/MouseTracker'

// TRACESPACE
const pcbStackup = require('pcb-stackup')

class Renderer extends Component {
  constructor(props) {
    super(props)
    this.state = {
      rendered: null,
      job: null,
      CSS3DObjects: [],
      camera: 'perspective',
    }
    this.root = document.documentElement
  }

  CSS3DObjects = []

  // Three.js
  addInitSVGFromDom = () => {
    // FRONT
    var element = document.getElementById('front')
    //console.log(element)
    this.frontPCBObject = new CSS3DObject(element)
    this.frontPCBObject.name = 'front'
    this.frontPCBObject.position.x = 0
    this.frontPCBObject.position.y = 25
    this.frontPCBObject.position.z = 1
    this.cssScene.add(this.frontPCBObject)

    // BACK
    var element = document.getElementById('back')
    //console.log(element)
    this.backPCBObject = new CSS3DObject(element)
    this.backPCBObject.name = 'back'
    this.backPCBObject.position.x = 0
    this.backPCBObject.position.y = 25
    this.backPCBObject.position.z = 0.5
    this.cssScene.add(this.backPCBObject)

    this.setState({ CSS3DObjects: [this.frontPCBObject, this.backPCBObject] })
  }

  // Higher Level Abstraction Methods
  setJob = (job, layerartwork, finishedartwork) => {
    this.removeAllCSS3DObjects()
    layerartwork.forEach((layer) => {
      //console.log(layer)
      this.addLayer(layer, false)
    })
    finishedartwork.forEach((layer) => {
      //console.log(layer)
      this.addLayer(layer, true)
    })
    this.setState({ CSS3DObjects: this.cssScene.children, job: job })
  }

  // High Level Absraction Methods
  addLayer = (layer, visible) => {
    //console.log(layer)
    // layer = {name: '', type: '', side: '', svg: ''}
    var svgElement = document.createElement('div')
    svgElement.id = layer.name
    //svgElement.style.visibility = visible
    svgElement.setAttribute('data-type', layer.type)
    svgElement.setAttribute('data-side', layer.side)
    svgElement.style.width = '0px'
    svgElement.style.height = '0px'
    svgElement.style.position = 'relative'
    if (layer.svg) {
      svgElement = this.setSVGinElement(layer, svgElement)
    } else {
    }

    this.addElementToThree(svgElement, visible)
  }

  setSVGinElement = (layer, svgElement) => {
    //console.log(layer, svgElement)
    svgElement.innerHTML = layer.svg
    var svgChildElement = svgElement.childNodes[0]
    //console.log(svgChildElement)
    var viewBoxString = svgChildElement.getAttribute('viewBox')
    var viewBox = viewBoxString.split(' ')
    var originx = Number(viewBox[0]) / 1000
    var originy = Number(viewBox[1]) / 1000
    var width = Number(viewBox[2]) / 1000
    var height = Number(viewBox[3]) / 1000
    //console.log(originx, originy, width, height)
    svgElement.dataset.width = width
    svgElement.dataset.height = height
    svgChildElement.style.position = 'relative'
    svgChildElement.style.transformOrigin = '0 0'
    if (svgElement.id === 'back') {
      svgChildElement.style.bottom = `calc(${height + originy}in * var(--svg-scale))`
      svgChildElement.style.left = `calc(${originx + width}in * var(--svg-scale))`
    } else if (svgElement.id === 'front'){
      var widthtext = document.createElement('h4')
      widthtext.className = 'width-measurement'
      widthtext.innerHTML = `WIDTH: ${width}in`
      widthtext.style.bottom = `calc(${originy}in * var(--svg-scale))`
      widthtext.style.left = `calc(${originx + width}in * var(--svg-scale))`
      svgElement.appendChild(widthtext)
      var heighttext = document.createElement('h4')
      heighttext.className = 'height-measurement'
      heighttext.innerHTML = `HEIGHT: ${height}in`
      heighttext.style.bottom = `calc(${height + originy}in * var(--svg-scale))`
      heighttext.style.left = `calc(${originx}in * var(--svg-scale))`
      svgElement.appendChild(heighttext)
      svgChildElement.style.bottom = `calc(${height + originy}in * var(--svg-scale))`
      svgChildElement.style.left = `calc(${originx}in * var(--svg-scale))`
    } else {
      svgChildElement.style.bottom = `calc(${height + originy}in * var(--svg-scale))`
      svgChildElement.style.left = `calc(${originx}in * var(--svg-scale))`
    }
    return svgElement
  }

  removeSVGinElement = (layer) => {
    var svgElement = document.getElementById(layer.name)
    svgElement.innerHTML = ''
  }

  removeLayer = (layer) => {
    this.removeCSS3DObject(layer.name)
  }

  // Low Level Abstraction Methods
  addElementToThree = (SVGObject, visible) => {
    //console.log('Adding SVG Object ', SVGObject)
    var newCSS3DObject = new CSS3DObject(SVGObject)
    newCSS3DObject.name = SVGObject.id
    newCSS3DObject.visible = visible
    //newCSS3DObject.position.x = parseInt(viewBox[0]) / 1000
    //newCSS3DObject.position.y = parseInt(viewBox[1]) / 1000
    newCSS3DObject.position.x = 0
    newCSS3DObject.position.y = 0
    //newCSS3DObject.translate(0, 0, 0)
    if (newCSS3DObject.name === 'back') {
      newCSS3DObject.position.z = -0.5
    } else if (newCSS3DObject.name === 'front') {
      newCSS3DObject.position.z = 0.5
    }
    this.cssScene.add(newCSS3DObject)
    //this.addPointer(newCSS3DObject)
    //this.setState({ CSS3DObjects: this.cssScene.children })
  }

  removeCSS3DObject = (name) => {
    this.cssScene.remove(this.state.CSS3DObjects.find((x) => x.name === name))
    this.setState({ CSS3DObjects: this.cssScene.children })
  }

  removeAllCSS3DObjects = () => {
    for (var i = this.state.CSS3DObjects.length - 1; i >= 0; i--) {
      this.cssScene.remove(this.state.CSS3DObjects[i])
    }
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
    //console.log(type)
    if (type === 'perspective') {
      this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.01, 1000)
      this.camera.position.z = 700
      this.controls = new OrbitControls(this.camera, this.cssRenderer.domElement)
      this.controls.enableRotate = true
      //this.controls.enableZoom = true
      this.setState({ camera: 'perspective' })
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
      //this.controls.enableZoom = false
      this.setState({ camera: 'orthographic' })
    } else {
      console.log('unkown camera type:', type)
    }
  }

  // customZoom = (delta) => {
  //   var cssprop = getComputedStyle(this.root).getPropertyValue('--svg-scale')
  //   this.root.style.setProperty('--svg-scale', parseInt(cssprop) / 10 + delta)
  //   console.log(cssprop)
  //   console.log(delta)
  // }

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
    //this.cssScene.scale.set(0.1, 0.1, 0.1) // due to scaling svgs by 10x

    // Create Renderer
    this.cssRenderer = new CSS3DRenderer()
    this.cssRenderer.setSize(window.innerWidth, window.innerHeight)
    rendercontainer.appendChild(this.cssRenderer.domElement)
    this.cssRenderer.domElement.id = 'css-renderer'
    this.svgContainer = this.cssRenderer.domElement.childNodes[0]
    this.svgContainer.id = 'svg-container'

    //this.captureMouse2(this.svgContainer)

    // Outer Method to add objects to dom
    this.addInitSVGFromDom()

    //rendercontainer.onwheel = (event) => this.customZoom(event.wheelDelta) // Depreciated => zooming is vert slow | planning to replace with quality slider

    // Use orbit controls on renderer
    this.controls = new OrbitControls(this.camera, this.cssRenderer.domElement)
    //this.controls.minZoom = 0
    this.controls.maxZoom = 700
    //this.controls.enableRotate = false;
    //this.controls.enableZoom = false
    //this.controls.zoomSpeed = 0.001
    //this.controls.dispatchEvent({ type: 'movement', message: 'moving' })
    //this.controls.addEventListener('movement', (event) => console.log(event))
    //this.controls.addEventListener('change', (event) => console.log(event))

    // Other Three objects
    this.clock = new THREE.Clock()
    this.stats = new Stats()
    this.stats.domElement.classList.add('stats')
    root.appendChild(this.stats.dom)
    this.setState({ rendered: true })
  }

  addPointer = (cssobj) => {
    var moonDiv = document.createElement('div')
    moonDiv.className = 'label'
    moonDiv.textContent = 'Moon'
    moonDiv.style.marginTop = '-1em'
    var moonLabel = new CSS3DObject(moonDiv)
    moonLabel.position.set(0, 0, 0)
    cssobj.add(moonLabel)
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
    // this.rayCaster.setFromCamera( this.mousePosition, this.camera )
    this.cssRenderer.render(this.cssScene, this.camera)
    this.stats.update()

    requestAnimationFrame(this.animationHandler)
  }

  render() {
    console.log('Rendering Renderer')
    //console.log(this.state)
    return (
      <div style={{ height: '100%' }}>
        <SideBar
          job={this.state.job}
          layers={this.state.CSS3DObjects}
          cameraSelector={(...props) => this.cameraSelector(...props)}
          setJob={(...props) => this.setJob(...props)}
          setSVGinElement={(layer, svgElement) => this.setSVGinElement(layer, svgElement)}
          removeSVGinElement={(layer) => this.removeSVGinElement(layer)}
          clear={() => this.removeAllCSS3DObjects()}
          update={() => this.updateCSSObjects()}
        />
        {this.svgContainer ? (
          <MouseTracker
            object={this.svgContainer}
            camera={this.state.camera}
            render={(coordinates) => <h4>{`${coordinates.x}in, ${coordinates.y}in`}</h4>}
          />
        ) : (
          <h1>loading</h1>
        )}
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

// DEPRECIATED METHODS

/*

  //   getClicked3DPoint = (evt, object) => {
  //     evt.preventDefault();
  //     let mousePosition = {}
  //     //let canvasPosition = this.cssRenderer.domElement.position()
  //     mousePosition.x = ((evt.clientX) / this.cssRenderer.domElement.width) * 2 - 1;
  //     mousePosition.y = -((evt.clientY) / this.cssRenderer.domElement.height) * 2 + 1;

  //     this.rayCaster.setFromCamera(mousePosition, this.camera);
  //     var intersects = this.rayCaster.intersectObjects(this.cssScene.children, true);
  //     console.log(intersects)
  //     if (intersects.length > 0)
  //         return intersects[0].point;
  // };

  // captureMouse = () => {
  //   this.svgContainer.onmousemove = (MouseEvent) => {
  //     var rect = MouseEvent.target.getBoundingClientRect();
  //     console.log(rect);
  //     let pt = {}
  //     pt.x =  MouseEvent.clientX - rect.left,
  //     pt.y =  MouseEvent.clientY - rect.top
  //     console.log(pt)
  //     const style = window.getComputedStyle(this.svgContainer)
  //     const transform = style.transform
  //     let mat = transform.match(/^matrix3d\((.+)\)$/);
  //     if (mat) {
  //       var prematrix = mat[1].split`, `.map(x=>+x)
  //       var matrix = this.listToMatrix(prematrix, 4)
  //     }
  //     //const matrix = this.svgContainer.getCTM()
  //     console.log(mat)
  //     console.log(matrix)
  //     var cursorpt = pt.matrixTransform(matrix)
  //     console.log(cursorpt)
  //   };
  // };

  // listToMatrix = (list, elementsPerSubArray) => {
  //   var matrix = [],
  //     i,
  //     k;

  //   for (i = 0, k = -1; i < list.length; i++) {
  //     if (i % elementsPerSubArray === 0) {
  //       k++;
  //       matrix[k] = [];
  //     }

  //     matrix[k].push(list[i]);
  //   }

  //   return matrix;
  // };

  // captureMouse2 = ({obj}) => {
  //   var pointer = document.createElement('h1')
  //   pointer.id = 'pointer'

  //   // pointer.style.position = `relative`
  //   // pointer.style.lineHeight = `0px`
  //   // pointer.style.padding = `0px`
  //   // pointer.style.margin = `0px`
  //   // pointer.style.transformOrigin = `0px 0px`
  //   // pointer.style.textShadow = '2px 2px black;'
  //   //pointer.style.transform = `scale(1,-1)`

  //   //var text = document.createTextNode('Hello World')
  //   //pointer.appendChild(text)
  //   obj.appendChild(pointer)
  //   obj.addEventListener('mousemove', (event) => {
  //     var rendercontainer = document.getElementById('render-container')
  //     var quality = getComputedStyle(rendercontainer).getPropertyValue('--svg-scale')
  //     let bound = obj.getBoundingClientRect()
  //     //console.log(bound)
  //     //var pt = svg.createSVGPoint()
  //     let pt = {}
  //     pt.x = event.clientX - bound.left
  //     pt.y = bound.height - event.clientY + bound.top
  //     //console.log(event);
  //     const style = window.getComputedStyle(this.svgContainer)
  //     const transform = style.transform
  //     let mat = transform.match(/^matrix3d\((.+)\)$/)
  //     if (mat) {
  //       var prematrix = mat[1].split`, `.map((x) => +x)
  //       var matrix = this.listToMatrix(prematrix, 4)
  //     }
  //     var scale = prematrix[0]
  //     //console.log(matrix)
  //     //console.log(svg.getScreenCTM().inverse())
  //     //var cursorpt =  pt.matrixTransform(svg.getScreenCTM().inverse());
  //     //var cursorpt =  pt.matrixTransform(this.svgContainer.getScreenCTM().inverse());
  //     if (this.state.camera === 'orthographic') {
  //       console.log('(' + pt.x / scale / 96 / quality + ', ' + pt.y / scale / 96 / quality + ')')
  //       pointer.style.transform = `scale(${0.05 / scale},-${0.05 / scale})`
  //       pointer.style.left = `${pt.x / scale}px`
  //       pointer.style.bottom = `-${pt.y / scale}px`
  //       pointer.innerHTML = `&#x21D6; (${(pt.x / scale / 96 / quality).toFixed(3)}in, ${(
  //         pt.y /
  //         scale /
  //         96 /
  //         quality
  //       ).toFixed(3)}in)`
  //     }
  //   })
  //   return (
  //     <pointer/>
  //   )
  // }

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
  */
