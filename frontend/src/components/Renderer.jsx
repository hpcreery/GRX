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
import InfoCoords from './functional/InfoCoords'

// TRACESPACE
const pcbStackup = require('pcb-stackup')

// SVGJS
import SVG from 'svg.js'

const DrawBoardContext = React.createContext()

class Renderer extends Component {
  constructor(props) {
    super(props)
    this.state = {
      rendered: null,
      job: null,
      CSS3DObjects: [],
      cameraType: 'orthographic',
      mouseCoordinates: { pixel: { x: 0, y: 0 }, inch: { x: 0, y: 0 }, mm: { x: 0, y: 0 }, draw: { x: 0, y: 0 } },
    }
    ;(this.drawBoardSize = 100000), (this.drawBoardScale = 0.1)
    this.svgContainer = null
    this.drawContainer = null
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

  initDrawBoard = () => {
    this.drawContainer = document.createElement('div')
    this.drawContainer.id = 'draw-board'
    this.drawContainer.setAttribute('data-context', 'drawing')
    this.drawContainer.style.zIndex = 1000
    this.drawContainer.style.transform =
      'matrix3d(1, 0, 0, 0, 0, -1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 1) scale(var(--svg-scale))'
    //this.addElementToThree(this.drawContainer, true)
    this.svgContainer.appendChild(this.drawContainer)
    console.log(document.getElementById('draw-board'))
    this.drawing = SVG(this.drawContainer.id).size(this.drawBoardSize, this.drawBoardSize)
    let svgChildElement = this.drawContainer.childNodes[0]
    svgChildElement.style.top = `-${this.drawBoardSize / 2}px`
    svgChildElement.style.left = `-${this.drawBoardSize / 2}px`
    svgChildElement.style.position = `relative`
    svgChildElement.style.transformOrigin = `center`
    svgChildElement.style.transform = `scale(${this.drawBoardScale})`
    svgChildElement.style.cursor = 'crosshair'
    //this.drawContainer.addEventListener('click', this.handleMouseLocation)
    //this.handeMouseFeatures()
    //this.drawContainer.addEventListener('touchstart', this.handleMouseLocation)
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
    //console.log(svgChildElement.innerHTML)
    let g = []
    svgChildElement.childNodes.forEach((node) => {
      if (node.nodeName == 'defs') {
      } else if (node.nodeName == 'g') {
        node.childNodes.forEach((node) => {
          if (node.nodeName == 'path') {
            g.push({
              type: node.nodeName,
              g: 'line/surface',
              lineWidth: node.attributes['stroke-width'] ? node.attributes['stroke-width'].value : 0,
              code: node.attributes.d.value,
              attr: node.attributes,
            })
          } else if (node.nodeName == 'use') {
            g.push({
              type: node.nodeName,
              g: 'pad',
              x: node.attributes.x.value,
              y: node.attributes.y.value,
              shape: node.attributes['xlink:href'].value,
              attr: node.attributes,
            })
          }
        })
      }
    })

    // console.log(g)
    // let svgElements = svgChildElement.querySelectorAll('g > *')
    // console.log(svgElements)
    //svgElement.addEventListener('mouseover', (e) => console.log(e))
    // svgElements.forEach((node) => {
    //   let initColor = node.style.color
    //   let g
    //   node.onmouseover = (e) => {
    //     e.target.style.color = '#08979c'

    //     if (node.nodeName == 'path') {
    //       g = {
    //         type: node.nodeName,
    //         g: 'line/surface',
    //         lineWidth: node.attributes['stroke-width'] ? node.attributes['stroke-width'].value : 0,
    //         code: node.attributes.d.value,
    //         attr: node.attributes,
    //       }
    //     } else if (node.nodeName == 'use') {
    //       g = {
    //         type: node.nodeName,
    //         g: 'pad',
    //         x: node.attributes.x.value,
    //         y: node.attributes.y.value,
    //         shape: node.attributes['xlink:href'].value,
    //         attr: node.attributes,
    //       }
    //     }
    //     console.log(g)
    //   }

    //   node.onmouseleave = (e) => {
    //     e.target.style.color = initColor
    //   }
    // })

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
    console.log('Rendering Renderer', this.units)
    let layers = this.state.CSS3DObjects.filter((layer) => layer.context == 'board')
    //console.log(layers)
    return (
      <div style={{ height: '100%' }}>
        <DrawBoardContext.Provider
          value={{
            svgContainer: this.svgContainer,
            drawContainer: this.drawContainer,
            drawBoardSize: this.drawBoardSize,
            drawBoardScale: this.drawBoardScale,
          }}
        >
          <SideBar
            job={this.state.job}
            layers={layers}
            svgContainer={this.svgContainer}
            drawContainer={this.drawContainer}
            drawBoardSize={this.drawBoardSize}
            drawBoardScale={this.drawBoardScale}
            cameraSelector={(...props) => this.cameraSelector(...props)}
            setJob={(...props) => this.setJob(...props)}
            setSVGinDIV={(layer, divLayer) => this.setSVGinDIV(layer, divLayer)}
            removeSVGinDIV={(layer) => this.removeSVGinDIV(layer)}
            clear={() => this.removeAllCSS3DObjects()}
            update={() => this.updateCSSObjects()}
          />
          <InfoCoords />
        </DrawBoardContext.Provider>
        <div
          id='bottom-info-bar'
          style={{
            position: 'absolute',
            width: '100%',
            textAlign: 'center',
            bottom: '0px',
            zIndex: '1000',
            filter: 'drop-shadow(2px 4px 6px black)',
          }}
        >
          <h4>0in, 0in</h4>
        </div>
      </div>
    )
  }

  componentDidMount() {
    this.setupScene()
    this.animationHandler()
    this.initDrawBoard()
    window.addEventListener('resize', this.onWindowResize, false)
    this.controls.update()
    //this.setUpKeyboardEvents()
  }
  componentDidUpdate() {
    //console.log(this.state)
  }
}

export { Renderer as default, DrawBoardContext }

// Depreciated or Moved
// initDrawBoard = () => {
//   this.drawContainer = document.createElement('div')
//   this.drawContainer.id = 'draw-board'
//   this.drawContainer.setAttribute('data-context', 'drawing')
//   this.drawContainer.style.zIndex = 1000
//   this.drawContainer.style.transform =
//     'matrix3d(1, 0, 0, 0, 0, -1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 1) scale(var(--svg-scale))'
//   //this.addElementToThree(this.drawContainer, true)
//   this.svgContainer.appendChild(this.drawContainer)
//   console.log(document.getElementById('draw-board'))
//   this.drawing = SVG(this.drawContainer.id).size(this.drawBoardSize, this.drawBoardSize)
//   let svgChildElement = this.drawContainer.childNodes[0]
//   svgChildElement.style.top = `-${this.drawBoardSize / 2}px`
//   svgChildElement.style.left = `-${this.drawBoardSize / 2}px`
//   svgChildElement.style.position = `relative`
//   svgChildElement.style.transformOrigin = `center`
//   svgChildElement.style.transform = `scale(${this.drawBoardScale})`
//   svgChildElement.style.cursor = 'crosshair'
//   //this.drawContainer.addEventListener('click', this.handleMouseLocation)
//   //this.handeMouseFeatures()
//   //this.drawContainer.addEventListener('touchstart', this.handleMouseLocation)
// }

// handleMouseLocation = (event, action) => {
//   let mouseCoordinates = { pixel: { x: 0, y: 0 }, inch: { x: 0, y: 0 }, mm: { x: 0, y: 0 }, draw: { x: 0, y: 0 } }
//   mouseCoordinates.pixel.x = (event.offsetX - this.drawBoardSize / 2) * this.drawBoardScale
//   mouseCoordinates.pixel.y = -((event.offsetY - this.drawBoardSize / 2) * this.drawBoardScale)
//   mouseCoordinates.inch.x = mouseCoordinates.pixel.x / 96
//   mouseCoordinates.inch.y = mouseCoordinates.pixel.y / 96
//   mouseCoordinates.mm.x = mouseCoordinates.inch.x * 24
//   mouseCoordinates.mm.y = mouseCoordinates.inch.y * 24
//   mouseCoordinates.draw.x = event.offsetX
//   mouseCoordinates.draw.y = event.offsetY
//   action(mouseCoordinates)

//   // Slow, but usefule in a different funtion.
//   // this.setState({
//   //   mouseCoordinates,
//   // })
// }

// handeMouseFeatures = () => {
//   this.drawing.clear()
//   if (this.state.cameraType == 'orthographic') {
//     this.drawContainer.addEventListener('click', (e) => this.handleMouseLocation(e, this.ruler), { once: true })
//   }
// }

// ruler = (coordinates) => {
//   //console.log(coordinates)
//   let startPosition = coordinates
//   let line = this.drawing
//     .line(coordinates.draw.x, coordinates.draw.y, coordinates.draw.x, coordinates.draw.y)
//     .stroke({ color: 'white', width: 3, linecap: 'round' })
//   var text = this.drawing.text(`DX:0 DY:0 D:0`).click((e) => console.log(e))
//   text.font({ fill: 'white', family: 'Inconsolata', size: 50 })
//   let lineDrawing = (e) => {
//     this.handleMouseLocation(e, (coordinates) => {
//       line.attr({ x2: coordinates.draw.x, y2: coordinates.draw.y })
//       text
//         .move(coordinates.draw.x, coordinates.draw.y)
//         .text(
//           `DX:${(coordinates.inch.x - startPosition.inch.x).toFixed(5)} DY:${(
//             coordinates.inch.y - startPosition.inch.y
//           ).toFixed(5)} D:${Math.sqrt(
//             Math.pow(coordinates.inch.x - startPosition.inch.x, 2) +
//               Math.pow(coordinates.inch.y - startPosition.inch.y, 2)
//           ).toFixed(5)}`
//         )
//     })
//   }
//   this.drawContainer.addEventListener('mousemove', lineDrawing)
//   this.drawContainer.addEventListener('click', (e) => {
//     this.drawContainer.removeEventListener('mousemove', lineDrawing)
//   })
// }

// setUpKeyboardEvents = () => {
//   let doc_keyUp = (e) => {
//     if (e.altKey && e.key === 'r') {
//       this.handeMouseFeatures()
//     }
//   }
//   document.addEventListener('keyup', doc_keyUp, false)
// }
