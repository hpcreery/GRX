// REACT
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

// FUNCTIONAL
import MouseTracker from './functional/MouseTracker'
import MouseActions from './functional/MouseActions'

// TRACESPACE
const pcbStackup = require('pcb-stackup')

// SVGJS
import SVG from 'svg.js'

class Renderer extends Component {
  constructor(props) {
    super(props)
    this.state = {
      rendered: null,
      job: null,
      CSS3DObjects: [],
      cameraType: 'orthographic',
      mouseCoordinates: { pixel: { x: 0, y: 0 }, inch: { x: 0, y: 0 }, mm: { x: 0, y: 0 }, draw: { x: 0, y: 0 } },
      drawBoardSize: 10000,
    }
    this.root = document.documentElement
  }

  CSS3DObjects = []

  // Three.js
  addInitSVGFromDom = () => {
    // FRONT
    var element = document.getElementById('front')
    this.frontPCBObject = new CSS3DObject(element)
    this.frontPCBObject.name = 'front'
    this.frontPCBObject.position.x = 0
    this.frontPCBObject.position.y = 25
    this.frontPCBObject.position.z = 1
    this.frontPCBObject.context = element.getAttribute('data-context')
    this.cssScene.add(this.frontPCBObject)

    // BACK
    var element = document.getElementById('back')
    this.backPCBObject = new CSS3DObject(element)
    this.backPCBObject.name = 'back'
    this.backPCBObject.position.x = 0
    this.backPCBObject.position.y = 25
    this.backPCBObject.position.z = 0.5
    this.backPCBObject.context = element.getAttribute('data-context')
    this.cssScene.add(this.backPCBObject)

    this.setState({ CSS3DObjects: [this.frontPCBObject, this.backPCBObject] })
  }

  // Higher Level Abstraction Functions
  setJob = (job, layerartwork, finishedartwork) => {
    this.removeAllLayers()
    layerartwork.forEach((layer) => {
      this.addLayer(layer, false)
    })
    finishedartwork.forEach((layer) => {
      this.addLayer(layer, false)
    })
    this.setState({ CSS3DObjects: this.cssScene.children, job: job })
  }

  // High Level Absraction Functions
  addLayer = (layer, visible) => {
    var divLayer = document.createElement('div')
    divLayer.id = layer.name
    //divLayer.style.visibility = visible
    divLayer.setAttribute('data-type', layer.type)
    divLayer.setAttribute('data-side', layer.side)
    divLayer.setAttribute('data-context', 'board')
    divLayer.style.width = '0px'
    divLayer.style.height = '0px'
    divLayer.style.position = 'relative'
    if (layer.svg) {
      divLayer = this.setSVGinDIV(layer, divLayer)
    } else if (layer.canvas) {
      //divLayer = this.setCanvasinDIV(layer, divLayer)
    }
    this.addElementToThree(divLayer, visible)
  }

  setSVGinDIV = (layer, divLayer) => {
    //console.log(layer, divLayer)
    divLayer.innerHTML = layer.svg
    var svgChildElement = divLayer.childNodes[0]
    //console.log(svgChildElement)
    var viewBoxString = svgChildElement.getAttribute('viewBox')
    var widthattr = svgChildElement.getAttribute('width')
    var unit = widthattr.slice(-2)
    var viewBox = viewBoxString.split(' ')
    var originx = Number(viewBox[0]) / 1000
    var originy = Number(viewBox[1]) / 1000
    var width = Number(viewBox[2]) / 1000
    var height = Number(viewBox[3]) / 1000
    //console.log(originx, originy, width, height)
    divLayer.dataset.width = width
    divLayer.dataset.height = height
    svgChildElement.style.position = 'relative'
    svgChildElement.style.transformOrigin = '0 0'
    if (divLayer.id === 'back') {
      svgChildElement.style.bottom = `calc(${height + originy}${unit} * var(--svg-scale))`
      svgChildElement.style.left = `calc(${originx + width}${unit} * var(--svg-scale))`
    } else if (divLayer.id === 'front') {
      var widthtext = document.createElement('h4')
      widthtext.className = 'width-measurement'
      widthtext.innerHTML = `WIDTH: ${width}${unit}`
      widthtext.style.bottom = `calc(${originy}${unit} * var(--svg-scale))`
      widthtext.style.left = `calc(${originx + width}${unit} * var(--svg-scale))`
      divLayer.appendChild(widthtext)
      var heighttext = document.createElement('h4')
      heighttext.className = 'height-measurement'
      heighttext.innerHTML = `HEIGHT: ${height}${unit}`
      heighttext.style.bottom = `calc(${height + originy}${unit} * var(--svg-scale))`
      heighttext.style.left = `calc(${originx}${unit} * var(--svg-scale))`
      divLayer.appendChild(heighttext)
      svgChildElement.style.bottom = `calc(${height + originy}${unit} * var(--svg-scale))`
      svgChildElement.style.left = `calc(${originx}${unit} * var(--svg-scale))`
    } else {
      svgChildElement.style.bottom = `calc(${height + originy}${unit} * var(--svg-scale))`
      svgChildElement.style.left = `calc(${originx}${unit} * var(--svg-scale))`
    }
    return divLayer
  }

  removeSVGinDIV = (layer) => {
    var divLayer = document.getElementById(layer.name)
    divLayer.innerHTML = ''
  }

  removeLayer = (layer) => {
    this.removeCSS3DObject(layer.name)
  }

  // Low Level Abstraction Functions
  addElementToThree = (divLayer, visible) => {
    var newCSS3DObject = new CSS3DObject(divLayer)
    newCSS3DObject.name = divLayer.id
    newCSS3DObject.visible = visible
    newCSS3DObject.context = divLayer.getAttribute('data-context')
    newCSS3DObject.position.x = 0
    newCSS3DObject.position.y = 0
    //newCSS3DObject.translate(0, 0, 0)
    if (newCSS3DObject.name === 'back') {
      newCSS3DObject.position.z = -0.5
    } else if (newCSS3DObject.name === 'front') {
      newCSS3DObject.position.z = 0.5
    }
    this.cssScene.add(newCSS3DObject)
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

  removeAllLayers = () => {
    let boardLayers = this.state.CSS3DObjects.filter((layer) => layer.context == 'board')
    for (var i = boardLayers.length - 1; i >= 0; i--) {
      this.cssScene.remove(boardLayers[i])
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

  initDrawBoard = () => {
    this.drawContainer = document.createElement('div')
    this.drawContainer.id = 'draw-board'
    this.drawContainer.setAttribute('data-context', 'drawing')
    this.drawContainer.style.zIndex = 1000
    this.drawContainer.style.transform = 'scale(1, -1)'
    //this.addElementToThree(this.drawContainer, true)
    this.svgContainer.appendChild(this.drawContainer)
    console.log(document.getElementById('draw-board'))
    this.drawing = SVG(this.drawContainer.id).size(this.state.drawBoardSize, this.state.drawBoardSize)
    //this.drawContainer.addEventListener('click', this.handleMouseLocation)
    //this.handeMouseFeatures()
    //this.drawContainer.addEventListener('touchstart', this.handleMouseLocation)
  }

  handleMouseLocation = (event, action) => {
    //var rendercontainer = document.getElementById('render-container')
    //var quality = getComputedStyle(rendercontainer).getPropertyValue('--svg-scale')
    let mouseCoordinates = { pixel: { x: 0, y: 0 }, inch: { x: 0, y: 0 }, mm: { x: 0, y: 0 }, draw: { x: 0, y: 0 } }
    mouseCoordinates.pixel.x = event.offsetX - this.state.drawBoardSize / 2
    mouseCoordinates.pixel.y = event.offsetY - this.state.drawBoardSize / 2
    mouseCoordinates.inch.x = mouseCoordinates.pixel.x / 96
    mouseCoordinates.inch.y = mouseCoordinates.pixel.y / 96
    mouseCoordinates.mm.x = mouseCoordinates.inch.x * 24
    mouseCoordinates.mm.y = mouseCoordinates.inch.y * 24
    mouseCoordinates.draw.x = event.offsetX
    mouseCoordinates.draw.y = event.offsetY
    console.log(mouseCoordinates)
    //var rect = drawing.rect(10, 10).attr({ fill: '#f06' })
    console.log(action)
    action(mouseCoordinates)

    // Slow, but usefule in a different funtion.
    // this.setState({
    //   mouseCoordinates,
    // })

    // var line = this.drawing
    //   .line(0, 0, mouseCoordinates.draw.x, mouseCoordinates.draw.y)
    //   .stroke({ color: '#f06', width: 1, linecap: 'round' })
    //console.log(line.attr())
  }

  handeMouseFeatures = () => {
    this.drawing.clear()
    if (this.state.cameraType == 'orthographic') {
      this.drawContainer.addEventListener('click', (e) => this.handleMouseLocation(e, this.ruler), { once: true })
    }
  }

  ruler = (coordinates) => {
    console.log(coordinates)
    let startPosition = coordinates
    let line = this.drawing
      .line(coordinates.draw.x, coordinates.draw.y, coordinates.draw.x, coordinates.draw.y)
      .stroke({ color: 'white', width: 0.5, linecap: 'round' })
    var text = this.drawing.text(`DX:0 DY:0 D:0`)
    text.font({ fill: 'white', family: 'Inconsolata', size: 6 })
    let lineDrawing = (e) => {
      this.handleMouseLocation(e, (coordinates) => {
        console.log(text.attr())
        line.attr({ x2: coordinates.draw.x, y2: coordinates.draw.y })
        text
          .move(coordinates.draw.x, coordinates.draw.y)
          .text(
            `DX:${(coordinates.inch.x - startPosition.inch.x).toFixed(5)} DY:${(
              coordinates.inch.x - startPosition.inch.x
            ).toFixed(5)} D:${Math.sqrt(
              Math.pow(coordinates.inch.x - startPosition.inch.x, 2) +
                Math.pow(coordinates.inch.x - startPosition.inch.x, 2)
            ).toFixed(5)}`
          )
      })
    }
    this.drawContainer.addEventListener('mousemove', lineDrawing)
    this.drawContainer.addEventListener('click', (e) => {
      this.drawContainer.removeEventListener('mousemove', lineDrawing)
    })
  }

  setUpKeyboardEvents = () => {
    let doc_keyUp = (e) => {
      if (e.ctrlKey && e.key === 'r') {
        this.handeMouseFeatures()
      }
    }
    document.addEventListener('keyup', doc_keyUp, false)
  }

  // Camera type switcher
  cameraSelector = (type) => {
    //console.log(type)
    if (type === 'perspective') {
      this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.01, 1000)
      this.camera.position.z = 700
      this.controls = new OrbitControls(this.camera, this.cssRenderer.domElement)
      this.controls.enableRotate = true
      this.controls.zoomSpeed = 1
      //this.controls.enableZoom = true
      this.setState({ cameraType: type })
    } else if (type === 'orthographic') {
      this.camera = new THREE.OrthographicCamera(
        window.innerWidth / -2,
        window.innerWidth / 2,
        window.innerHeight / 2,
        window.innerHeight / -2,
        1,
        1000
      )
      this.camera.position.z = 900
      this.controls = new OrbitControls(this.camera, this.cssRenderer.domElement)
      this.controls.enableRotate = false
      this.controls.zoomSpeed = 1
      //this.controls.enableZoom = false
      this.setState({ cameraType: type })
    } else {
      console.log('unkown camera type:', type)
    }
  }

  setupScene = () => {
    var root = document.getElementById('root')
    this.rendercontainer = document.getElementById('render-container')

    // Create Scene
    this.cssScene = new THREE.Scene()

    // Create Renderer
    this.cssRenderer = new CSS3DRenderer()
    this.cssRenderer.setSize(window.innerWidth, window.innerHeight)
    this.cameraSelector('orthographic')
    this.rendercontainer.appendChild(this.cssRenderer.domElement)
    this.cssRenderer.domElement.id = 'css-renderer'
    this.svgContainer = this.cssRenderer.domElement.childNodes[0]
    this.svgContainer.id = 'svg-container'

    // Outer Method to add objects to dom
    this.addInitSVGFromDom()
    // rendercontainer.onwheel = (event) => this.customZoom(event.wheelDelta) // Depreciated => zooming is vert slow | planning to replace with quality slider

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
    this.cssRenderer.render(this.cssScene, this.camera)
    this.stats.update()
    this.controls.update()
    requestAnimationFrame(this.animationHandler)
  }

  render() {
    //console.log('Rendering Renderer')
    let layers = this.state.CSS3DObjects.filter((layer) => layer.context == 'board')
    //console.log(layers)
    return (
      <div style={{ height: '100%' }}>
        <SideBar
          job={this.state.job}
          layers={layers}
          cameraSelector={(...props) => this.cameraSelector(...props)}
          setJob={(...props) => this.setJob(...props)}
          setSVGinDIV={(layer, divLayer) => this.setSVGinDIV(layer, divLayer)}
          removeSVGinDIV={(layer) => this.removeSVGinDIV(layer)}
          clear={() => this.removeAllCSS3DObjects()}
          update={() => this.updateCSSObjects()}
        />
        {/* {this.svgContainer ? (
          <MouseTracker
            object={this.svgContainer}
            camera={this.state.camera}
            render={(coordinates) => <h4>{`${coordinates.x}in, ${coordinates.y}in`}</h4>}
          />
        ) : (
          <h1>loading</h1>
        )} */}
        {this.svgContainer ? (
          <MouseActions
            drawBoardSize={this.state.drawBoardSize}
            drawContainer={this.drawContainer}
            render={(coordinates) => (
              <h4>{`${coordinates.inch.x.toFixed(5)}in, ${coordinates.inch.y.toFixed(5)}in`}</h4>
            )}
          />
        ) : (
          <h1>loading</h1>
        )}
      </div>
    )
  }

  componentDidMount() {
    this.setupScene()
    this.animationHandler()
    this.initDrawBoard()
    window.addEventListener('resize', this.onWindowResize, false)
    this.controls.update()
    this.setUpKeyboardEvents()
  }
  componentDidUpdate() {
    //console.log(this.state)
  }
}

export default Renderer
