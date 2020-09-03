//import * as THREE from './three.min.js'
import * as THREE from '../three/build/three.module.js'
import { OrbitControls } from '../three/examples/jsm/controls/OrbitControls.js'
//import { CSS3DRenderer, CSS3DObject } from "CSS3DRenderer.js"

//import { TWEEN } from './jsm/libs/tween.module.min.js';
//import { TrackballControls } from './jsm/controls/TrackballControls.js';
import { CSS3DRenderer, CSS3DObject } from '../three/examples/jsm/renderers/CSS3DRenderer.js'
import Stats from '../three/examples/jsm/libs/stats.module.js'
;(function go() {
  var camera, scene, cssScene, renderer, cssRenderer
  var clock, controls, stats

  init()
  animate()

  function init() {
    console.log('init')

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.01, 1000)
    camera.position.z = 700
    camera.lookAt(new THREE.Vector3(0, 0, 0))

    clock = new THREE.Clock()

    scene = new THREE.Scene()

    var size = 1000
    var divisions = 100

    var gridHelper = new THREE.GridHelper(size, divisions)
    scene.add(gridHelper)

    stats = new Stats()
    document.body.appendChild(stats.dom)

    // var axesHelper = new THREE.AxesHelper(10, 10, 10)
    // scene.add(axesHelper)

    // geometry = new THREE.BoxGeometry(1, 1, 1)
    // material = new THREE.MeshNormalMaterial()

    // mesh = new THREE.Mesh(geometry, material)
    // scene.add(mesh)

    // renderer = new THREE.WebGLRenderer({ antialias: true })
    // renderer.setSize(window.innerWidth, window.innerHeight)
    // document.body.appendChild(renderer.domElement)

    cssRenderer = new CSS3DRenderer()
    cssRenderer.setSize(window.innerWidth, window.innerHeight)
    cssRenderer.domElement.style.position = 'absolute'
    cssRenderer.domElement.style.height = '100%'
    cssRenderer.domElement.style.width = '100%'
    cssRenderer.domElement.style.top = 0
    document.body.appendChild(cssRenderer.domElement)

    cssScene = new THREE.Scene()
    var element = document.getElementById('front-pcb')
    console.log(element)
    // var element = document.createElement('div');
    // element.innerHTML = 'text';
    // element.style.background = "#0094ff";
    // element.style.color = "white";
    // element.style.padding = "2px";
    // element.style.border = "0px";
    // element.style.margin = "0px";
    var div = new CSS3DObject(element)
    div.position.x = 0
    //div.x = -1
    div.position.y = 25
    div.position.z = 1
    cssScene.add(div)

    // BACK
    var element = document.getElementById('back-pcb')
    console.log(element)
    // var element = document.createElement('div');
    // element.innerHTML = 'text';
    // element.style.background = "#0094ff";
    // element.style.color = "white";
    // element.style.padding = "2px";
    // element.style.border = "0px";
    // element.style.margin = "0px";
    var div = new CSS3DObject(element)
    div.position.x = 0
    div.position.y = 25
    div.position.z = 0.9
    cssScene.add(div)

    controls = new OrbitControls(camera, cssRenderer.domElement)
  }

  window.addEventListener( 'resize', onWindowResize, false );

  function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

  }

  controls.update()

  function animate() {
    var elapsed = clock.getElapsedTime()
    var delta = clock.getDelta()

    //controls.update()

    // renderer.render(scene, camera)
    cssRenderer.render(cssScene, camera)
    stats.update()

    requestAnimationFrame(animate)
  }
})()
