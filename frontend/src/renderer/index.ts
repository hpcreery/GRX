import {s} from 'hastscript'

import type {ImageTree, SizeEnvelope} from '@tracespace/plotter'
import {BoundingBox} from '@tracespace/plotter'

import {renderGraphic} from './render'
import type {SvgElement, ViewBox} from './types'

import * as PIXI from 'pixi.js'

export {renderGraphic} from './render'

export type {SvgElement, ViewBox} from './types'

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
  const {units, size, children} = image

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

// TOTALLY DEVELOPING
export async function createCanvas(): Promise<PIXI.Application<PIXI.ICanvas>> {
  // The application will create a renderer using WebGL, if possible,
  // with a fallback to a canvas render. It will also setup the ticker
  // and the root stage PIXI.Container
  const app = new PIXI.Application()

  // The application will create a canvas element for you that you
  // can then insert into the DOM
  // inputRef.current.appendChild(app.view as HTMLCanvasElement)

  // load the texture we need
  const texture = await PIXI.Assets.load('https://www.cbc.ca/kids/images/weird_wonderful_bunnies_header_update_1140.jpg')

  // This creates a texture from a 'bunny.png' image
  const bunny = new PIXI.Sprite(texture)

  // Setup the position of the bunny
  bunny.x = app.renderer.width / 2
  bunny.y = app.renderer.height / 2

  // Rotate around the center
  bunny.anchor.x = 0.5
  bunny.anchor.y = 0.5

  // Add the bunny to the scene we are building
  app.stage.addChild(bunny)

  // Listen for frame updates
  app.ticker.add(() => {
    // each frame we spin the bunny around a bit
    bunny.rotation += 0.01
  })
  return app
}

export class PixiRenderer extends PIXI.Application<PIXI.ICanvas> {
  // app: PIXI.Application<PIXI.ICanvas>
  constructor() {
    super()
    // this.demo()
  }
  async demo() {
    const texture = await PIXI.Assets.load('https://www.cbc.ca/kids/images/weird_wonderful_bunnies_header_update_1140.jpg')
    const bunny = new PIXI.Sprite(texture)
    bunny.x = this.renderer.width / 2
    bunny.y = this.renderer.height / 2
    bunny.anchor.x = 0.5
    bunny.anchor.y = 0.5
    this.stage.addChild(bunny)
    this.ticker.add(() => {
      bunny.rotation += 0.01
    })
  }

  async renderTree(image: ImageTree, viewBox?: ViewBox) {
    const {units, size, children} = image
    this.stage.addChild(...children.map(renderGraphic))
  }

  // async loadTexture(url: string): Promise<PIXI.Texture> {
  //   return await PIXI.Assets.load(url)
  // }
  // async loadTextures(urls: string[]): Promise<PIXI.Texture[]> {
  //   return await Promise.all(urls.map(url => this.loadTexture(url)))
  // }
  // async loadSprite(url: string): Promise<PIXI.Sprite> {
  //   const texture = await this.loadTexture(url)
  //   return new PIXI.Sprite(texture)
  // }
  // async loadSprites(urls: string[]): Promise<PIXI.Sprite[]> {
  //   return await Promise.all(urls.map(url => this.loadSprite(url)))
  // }
}