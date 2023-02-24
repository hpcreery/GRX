import * as PIXI from 'pixi.js'
import { useRef, useEffect } from 'react'

export default function Test() {
  const inputRef = useRef<HTMLDivElement>(document.createElement('div'))

  useEffect(() => {
    setuppixi()
  }, [])

  async function setuppixi() {
    // The application will create a renderer using WebGL, if possible,
    // with a fallback to a canvas render. It will also setup the ticker
    // and the root stage PIXI.Container
    const app = new PIXI.Application()

    // The application will create a canvas element for you that you
    // can then insert into the DOM
    inputRef.current.appendChild(app.view as HTMLCanvasElement)

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
  }

  return (
    <>
      <div ref={inputRef} />
    </>
  )
}
