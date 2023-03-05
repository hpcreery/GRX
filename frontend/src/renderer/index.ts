import { s } from 'hastscript'

import type { ImageTree, SizeEnvelope } from '@tracespace/plotter'
import { BoundingBox } from '@tracespace/plotter'

import { renderGraphic } from './render'
import type { SvgElement, ViewBox } from './types'

import * as PIXI from 'pixi.js'
import { DisplayObject, IApplicationOptions } from 'pixi.js'

import { IViewportOptions, Viewport } from 'pixi-viewport'
export { renderGraphic } from './render'

export type { SvgElement, ViewBox } from './types'

export const BASE_SVG_PROPS = {
  version: '1.1',
  xmlns: 'http://www.w3.org/2000/svg',
  'xmlns:xlink': 'http://www.w3.org/1999/xlink',
}

export const BASE_IMAGE_PROPS = {
  'stroke-linecap': 'round',
  'stroke-linejoin': 'round',
  'stroke-width': '0',
  'fill-rule': 'evenodd',
  'clip-rule': 'evenodd',
  fill: 'currentColor',
  stroke: 'currentColor',
}

export function render(image: ImageTree, viewBox?: ViewBox) {
  const { units, size, children } = image

  // viewBox = viewBox ?? sizeToViewBox(size)

  // return s(
  //   'svg',
  //   {
  //     ...BASE_SVG_PROPS,
  //     ...BASE_IMAGE_PROPS,
  //     viewBox: viewBox.join(' '),
  //     width: `${viewBox[2]}${units}`,
  //     height: `${viewBox[3]}${units}`,
  //   },
  //   children.map(renderGraphic)
  // )
}

// export function renderFragment(image: ImageTree): SvgElement {
//   return s('g', {}, image.children.map(renderGraphic))
// }

export function sizeToViewBox(size: SizeEnvelope): ViewBox {
  return BoundingBox.isEmpty(size)
    ? [0, 0, 0, 0]
    : [size[0], -size[3], size[2] - size[0], size[3] - size[1]]
}

export class CustomPixiApplication extends PIXI.Application<PIXI.ICanvas> {
  viewport: Viewport
  constructor(options?: Partial<IApplicationOptions>) {
    super(options)
    this.viewport = new Viewport({
      worldWidth: 1000,
      worldHeight: 1000,
      screenWidth: window.innerWidth, // TODO: fix this to allow embedded
      screenHeight: window.innerHeight, // TODO: fix this to allow embedded
      // @ts-ignore
      // divWheel: this.view,
      events: this.renderer.events,
    })
      .drag()
      .pinch({ percent: 2 })
      .wheel()
      // .decelerate()
    // this.demo()
    this.stage.addChild(this.viewport)
    console.log(this.stage)
    // this.ticker.start()
    window.addEventListener('resize', this.onResize)
  }

  onResize = () => {
    this.renderer.resize(window.innerWidth, window.innerHeight) // TODO: fix this to allow embedded
    this.viewport.resize(window.innerWidth, window.innerHeight) // TODO: fix this to allow embedded
  }

  async demo(viewport: Viewport) {
    const texture = await PIXI.Assets.load(
      'https://www.cbc.ca/kids/images/weird_wonderful_bunnies_header_update_1140.jpg'
    )
    const bunny = new PIXI.Sprite(texture)
    bunny.x = this.renderer.width / 2
    bunny.y = this.renderer.height / 2
    bunny.anchor.x = 0.5
    bunny.anchor.y = 0.5
    viewport.addChild(bunny)
    this.ticker.add(() => {
      bunny.rotation += 0.01
    })
  }

  async renderImageTree(image: ImageTree, viewBox?: ViewBox) {
    const { units, size, children } = image
    this.viewport.addChild(...children.map(renderGraphic))
    this.viewport.children.forEach((child) => {
      // child.interactive = true
      // child.buttonMode = true
      child.on('pointerdown', (event) => onClickDown(child))
      child.on('pointerup', (event) => onClickUp(child))
      child.on('pointerover', (event) => onPointerOver(child))
      child.on('pointerout', (event) => onPointerOut(child))
      // child.x = this.renderer.width / 2
      // child.y = this.renderer.height / 2
      // child.scale.set(100, 100)
      // child.dra
      // child.anchor.x = 0.5
      // child.anchor.y = 0.5
      // child.
    })
  }
}

function onClickDown(object: PIXI.DisplayObject) {
  if (object instanceof PIXI.Graphics) {
    object.tint = 0x333333
  }
}

function onClickUp(object: PIXI.DisplayObject) {
  if (object instanceof PIXI.Graphics) {
    object.tint = 0x666666
  }
}

function onPointerOver(object: PIXI.DisplayObject) {
  if (object instanceof PIXI.Graphics) {
    object.tint = 0x666666
  }
}

function onPointerOut(object: PIXI.DisplayObject) {
  if (object instanceof PIXI.Graphics) {
    object.tint = 0xffffff
  }
}
