import REGL from 'regl'
import { mat3, vec2, vec3 } from 'gl-matrix'
import LayerRenderer, { LayerRendererProps } from './layer'
import { initializeRenderers } from './collections'
import * as Comlink from 'comlink'
import plugins from './plugins'
import type { parser } from './plugins'
import type { Units } from './types'
import GridFrag from '../shaders/src/Grid.frag'
import GridVert from '../shaders/src/Grid.vert'
import { UID } from './utils'

interface WorldProps { }

interface WorldUniforms {
  u_Transform: mat3
  u_InverseTransform: mat3
  u_Resolution: vec2
  u_PixelSize: number
  u_OutlineMode: boolean
  u_PointerPosition: vec2
  u_PointerDown: boolean
}

interface WorldAttributes {
  a_Vertex_Position: vec2[]
}

export interface WorldContext {
  settings: RenderSettings
  transform: RenderTransform
  resolution: vec2
  transformMatrix: mat3
}

interface ScreenRenderProps {
  frameBuffer: REGL.Framebuffer
}

interface ScreenRenderUniforms {
  u_RenderTexture: REGL.Framebuffer
}

export interface RenderEngineBackendConfig {
  attributes?: WebGLContextAttributes | undefined
  width: number
  height: number
}

// export interface Stats {
//   renderDuration: number,
//   fps: number,
//   lastRenderTime: number
// }


export interface RenderSettings {
  FPS: number
  MSPFRAME: number
  OUTLINE_MODE: boolean
  BACKGROUND_COLOR: [number, number, number, number]
  MAX_ZOOM: number
  MIN_ZOOM: number
  ZOOM_TO_CURSOR: boolean
}

export interface RenderTransform {
  zoom: number
  position: vec2
  velocity: vec2
  dragging: boolean
  matrix: mat3
  matrixInverse: mat3
  update: () => void
}

export interface GridRenderProps {
  enabled: boolean
  color: [number, number, number, number]
  spacing_x: number
  spacing_y: number
  offset_x: number
  offset_y: number
  _type: number
  type: 'dots' | 'lines'
}

interface GridRenderUniforms {
  u_Spacing: vec2
  u_Offset: vec2
  u_Type: number
  u_Color: [number, number, number, number]
}

export interface LayerInfo {
  name: string,
  uid: string
  color: vec3,
  context: string,
  type: string,
  units: Units,
  visible: boolean,
  format: string
}

export const EngineEvents = {
  RENDER: 'RENDER',
  LAYERS_CHANGED: 'LAYERS_CHANGED',
} as const

export type TEngineEvents = typeof EngineEvents[keyof typeof EngineEvents] 

export interface Pointer {
  x: number
  y: number
  down: boolean
}

export class RenderEngineBackend {

  public settings: RenderSettings = {
    MSPFRAME: 1000 / 60,
    get FPS(): number {
      return 1000 / this.MSPFRAME
    },
    set FPS(value: number) {
      this.MSPFRAME = 1000 / value
    },
    OUTLINE_MODE: false,
    BACKGROUND_COLOR: [0, 0, 0, 0],
    MAX_ZOOM: 100,
    MIN_ZOOM: 0.001,
    ZOOM_TO_CURSOR: true
  }

  public offscreenCanvas: OffscreenCanvas

  public viewBox: {
    width: number
    height: number
  }

  public pointer: Pointer = {
    x: 0,
    y: 0,
    down: false
  }

  public transform: RenderTransform = {
    zoom: 1,
    position: [0, 0],
    velocity: [0, 0],
    dragging: false,
    matrix: mat3.create(),
    matrixInverse: mat3.create(),
    update: (): void => {
      this.updateTransform()
    }
  }

  public grid: GridRenderProps = {
    enabled: true,
    color: [0.2, 0.2, 0.2, 0.5],
    spacing_x: 1,
    spacing_y: 1,
    offset_x: 0,
    offset_y: 0,
    _type: 0,
    get type(): 'dots' | 'lines' {
      return this._type === 0 ? 'dots' : 'lines'
    },
    set type(value: 'dots' | 'lines') {
      switch (value) {
        case 'dots':
          this._type = 0
          break
        case 'lines':
          this._type = 1
          break
        default:
          this._type = 0
      }
    }
  }

  // public setGridProps(props: Partial<GridRenderProps>): void {
  //   Object.assign(this.grid, props)
  //   this.render(true)
  // }

  private dirty = true

  // public stats: Stats = {
  //   renderDuration: 0,
  //   fps: 0,
  //   lastRenderTime: 0
  // }

  // ** make layers a proxy so that we can call render when a property is updated
  // public layers: LayerRenderer[] = new Proxy([], {
  //   set: (target, name, value): boolean => {
  //     target[name] = value
  //     this.render(true)
  //     return true
  //   }
  // })

  public layers: LayerRenderer[] = []
  public layersQueue: { name: string, uid: string }[] = []

  public regl: REGL.Regl
  private world: REGL.DrawCommand<REGL.DefaultContext & WorldContext, WorldProps>

  private renderToScreen: REGL.DrawCommand<REGL.DefaultContext, ScreenRenderProps>
  private renderGrid: REGL.DrawCommand<REGL.DefaultContext, GridRenderProps>

  public parsers: {
    [key: string]: parser
  } = {}

  public eventTarget = new EventTarget()

  constructor(
    offscreenCanvas: OffscreenCanvas,
    { attributes, width, height }: RenderEngineBackendConfig
  ) {
    this.offscreenCanvas = offscreenCanvas
    this.viewBox = {
      width,
      height
    }

    const gl = offscreenCanvas.getContext('webgl', attributes)!

    this.regl = REGL({
      gl,
      extensions: [
        'angle_instanced_arrays',
        'OES_texture_float',
        'webgl_depth_texture',
        'EXT_frag_depth'
      ],
      profile: true
    })
    console.log('WEBGL LIMITS', this.regl.limits)

    initializeRenderers(this.regl)

    this.regl.clear({
      depth: 0
    })

    this.world = this.regl<WorldUniforms, WorldAttributes, WorldProps, WorldContext>({
      context: {
        settings: this.settings,
        transformMatrix: () => this.transform.matrix,
        transform: this.transform,
        resolution: () => [this.viewBox.width, this.viewBox.height]
      },

      uniforms: {
        u_Transform: () => this.transform.matrix,
        u_InverseTransform: () => this.transform.matrixInverse,
        u_Resolution: () => [this.viewBox.width, this.viewBox.height],
        u_PixelSize: 2,
        u_OutlineMode: () => this.settings.OUTLINE_MODE,
        u_PointerPosition: (_context: REGL.DefaultContext) => [this.pointer.x, this.pointer.y],
        u_PointerDown: (_context: REGL.DefaultContext) => this.pointer.down
      },

      attributes: {
        a_Vertex_Position: [
          [-1, -1],
          [+1, -1],
          [-1, +1],
          [+1, +1],
          [-1, +1],
          [+1, -1]
        ]
      },

      cull: {
        enable: false,
        face: 'front'
      },

      primitive: 'triangles',
      count: 6,
      offset: 0
    })

    this.renderGrid = this.regl<GridRenderUniforms, Record<string, never>, GridRenderProps>(
      {
        vert: GridVert,
        frag: GridFrag,
        uniforms: {
          u_Color: (_context: REGL.DefaultContext, props: GridRenderProps) => props.color,
          u_Spacing: (_context: REGL.DefaultContext, props: GridRenderProps) => [
            props.spacing_x,
            props.spacing_y
          ],
          u_Offset: (_context: REGL.DefaultContext, props: GridRenderProps) => [
            props.offset_x,
            props.offset_y
          ],
          u_Type: (_context: REGL.DefaultContext, props: GridRenderProps) => props._type,
        }
      },
    )

    this.renderToScreen = this.regl<ScreenRenderUniforms, Record<string, never>, ScreenRenderProps>(
      {
        vert: `
        precision highp float;
        attribute vec2 a_Vertex_Position;
        varying vec2 v_UV;
        void main () {
          v_UV = a_Vertex_Position;
          gl_Position = vec4(a_Vertex_Position, 1, 1);
        }
      `,
        frag: `
        precision highp float;
        uniform sampler2D u_RenderTexture;
        varying vec2 v_UV;
        void main () {
          gl_FragColor = texture2D(u_RenderTexture, (v_UV * 0.5) + 0.5);
        }
      `,

        blend: {
          enable: true,

          func: {
            srcRGB: 'one minus dst color',
            srcAlpha: 'one',
            dstRGB: 'one minus src color',
            dstAlpha: 'one'
          },

          equation: {
            rgb: 'add',
            alpha: 'add'
          },
          color: [0, 0, 0, 0.1]
        },

        depth: {
          enable: false,
          mask: false,
          func: 'greater',
          range: [0, 1]
        },

        uniforms: {
          u_RenderTexture: (_context: REGL.DefaultContext, props: ScreenRenderProps) =>
            props.frameBuffer
        }
      }
    )

    this.zoomAtPoint(0, 0, this.transform.zoom)
    this.render(true)
  }

  public resize(width: number, height: number): void {
    this.viewBox.width = width
    this.viewBox.height = height
    this.offscreenCanvas.width = width
    this.offscreenCanvas.height = height
    this.regl.poll()
    this.updateTransform()
    this.render(true)
  }

  public toss(): void {
    const { dragging } = this.transform
    if (this.transform.velocity[0] === 0 && this.transform.velocity[1] === 0) return
    if (dragging) return
    // const vel_rounded = this.transform.velocity.map((v) => Math.round(v)) as vec2
    vec2.add(this.transform.position, this.transform.position, this.transform.velocity)
    vec2.scale(this.transform.velocity, this.transform.velocity, 0.95)
    this.transform.update()
    if (
      Math.abs(this.transform.velocity[0]) < 0.05 &&
      Math.abs(this.transform.velocity[1]) < 0.05
    ) {
      this.transform.velocity[0] = 0
      this.transform.velocity[1] = 0
    } else {
      setTimeout(() => this.toss(), this.settings.MSPFRAME)
      // setTimeout(this.toss.bind(this), this.SETTINGS.MSPFRAME)
    }
  }

  public moveViewport(x: number, y: number): void {
    if (!this.transform.dragging) return
    this.transform.velocity = [x, y]
    vec2.add(this.transform.position, this.transform.position, this.transform.velocity)
    this.transform.update()
  }

  public grabViewport(): void {
    this.transform.dragging = true
  }

  public releaseViewport(): void {
    this.transform.dragging = false
    this.toss()
  }

  public zoom(x: number, y: number, s: number): void {
    if (this.settings.ZOOM_TO_CURSOR) {
      this.zoomAtPoint(x, y, s)
    } else {
      this.zoomAtPoint(x, x, s)
    }
  }

  public isDragging(): boolean {
    return this.transform.dragging
  }

  public updateTransform(): void {
    // http://www.opengl-tutorial.org/beginners-tutorials/tutorial-3-matrices/
    const { zoom, position } = this.transform
    const { width, height } = this.viewBox
    mat3.projection(this.transform.matrix, width, height)
    mat3.translate(this.transform.matrix, this.transform.matrix, position)
    mat3.scale(this.transform.matrix, this.transform.matrix, [zoom, zoom])
    mat3.scale(this.transform.matrix, this.transform.matrix, [height / width, 1])
    // mat3.scale(this.transform.matrix, this.transform.matrix, [1, width / height])
    mat3.translate(this.transform.matrix, this.transform.matrix, [width / 2, height / 2])
    mat3.scale(this.transform.matrix, this.transform.matrix, [width / 2, -height / 2])
    // mat3.scale(this.transform.matrix, this.transform.matrix, [height / width / 2, width / height / 2])

    mat3.invert(this.transform.matrixInverse, this.transform.matrix)

    // logMatrix(this.transform.matrix)

    // console.log(s)
    this.render()
  }

  public zoomAtPoint(x: number, y: number, s: number): void {
    const { zoom } = this.transform
    let newZoom = zoom - s / (1000 / zoom / 2)
    let zoomBy = newZoom / zoom
    if (newZoom < this.settings.MIN_ZOOM) {
      newZoom = this.settings.MIN_ZOOM
      zoomBy = newZoom / zoom
      this.transform.zoom = newZoom
    } else if (newZoom > this.settings.MAX_ZOOM) {
      newZoom = this.settings.MAX_ZOOM
      zoomBy = newZoom / zoom
      this.transform.zoom = newZoom
    } else {
      this.transform.zoom = newZoom
    }
    this.transform.position[0] = x - (x - this.transform.position[0]) * zoomBy
    this.transform.position[1] = y - (y - this.transform.position[1]) * zoomBy
    this.transform.update()
  }

  public async getWorldPosition(x: number, y: number): Promise<[number, number]> {
    const mouse_viewbox_pos: vec2 = [x * 2 - 1, y * 2 - 1]
    const mouse = vec2.transformMat3(vec2.create(), mouse_viewbox_pos, this.transform.matrixInverse)
    return [mouse[0], mouse[1]]
  }

  public async addLayer(params: Omit<LayerRendererProps, 'regl'>): Promise<void> {
    // console.log('Adding Layer', params.name, params.image)
    const layer = new LayerRenderer({
      ...params,
      regl: this.regl
    })
    this.layers.push(layer)
    this.render(true)
    this.eventTarget.dispatchEvent(new Event(EngineEvents.LAYERS_CHANGED))
  }

  public async addFile(params: { file: string, format: string, props: Partial<Omit<LayerRendererProps, 'regl' | 'image'>> }): Promise<void> {
    const pluginWorker = plugins[params.format]
    if (pluginWorker) {
      const tempUID = UID()
      this.layersQueue.push({ name: params.file, uid: tempUID })
      const callback = async (params: Omit<LayerRendererProps, "regl">): Promise<void> => await this.addLayer({ ...params, format: params.format })
      const instance = new pluginWorker()
      const parser = Comlink.wrap<parser>(instance)
      try {
        await parser(params.file, params.props, Comlink.proxy(callback))
      } catch (error) {
        console.error(error)
        throw error 
      } finally {
        parser[Comlink.releaseProxy]()
        instance.terminate()
        const index = this.layersQueue.findIndex((file) => file.uid === tempUID)
        if (index != -1) {
          this.layersQueue.splice(index, 1)
        }
        this.eventTarget.dispatchEvent(new Event(EngineEvents.LAYERS_CHANGED))
      }
    } else {
      console.error('No parser found for format: ' + params.format)
    }
  }

  public getLayers(): LayerInfo[] {
    return this.layers.map((layer) => {
      return {
        name: layer.name,
        uid: layer.uid,
        color: layer.color,
        context: layer.context,
        type: layer.type,
        units: layer.units,
        visible: layer.visible,
        format: layer.format
      }
    })
  }

  public removeLayer(uid: string): void {
    const index = this.layers.findIndex((layer) => layer.uid === uid)
    if (index === -1) return
    this.layers.splice(index, 1)
    this.render(true)
  }

  public setLayerProps(uid: string, props: Partial<Omit<LayerRendererProps, 'regl'>>): void {
    const layer = this.layers.find((layer) => layer.uid === uid)
    if (!layer) return
    Object.assign(layer, props)
    this.render(true)
  }

  public addEventCallback(event: TEngineEvents, listener: () => void): void {
    function runCallback(): void {
      listener()
    }
    this.eventTarget.addEventListener(event, runCallback)
  }

  public sample(x: number, y: number): void {
    for (const layer of this.layers) {
      if (!layer.visible) continue
      const data = this.regl.read({
        framebuffer: layer.framebuffer,
        x,
        y,
        width: 1,
        height: 1
      })
      if (data.reduce((acc, val) => acc + val, 0) < 1) continue
      console.log(layer.name)
    }
  }

  public setPointer(mouse: Partial<Pointer>): void {
    Object.assign(this.pointer, mouse)
    if (this.pointer.down) {
      this.render(true)
    }
  }

  public render(force = false): void {
    if (!this.dirty && !force) return
    this.dirty = false
    this.regl.clear({
      color: this.settings.BACKGROUND_COLOR,
      depth: 1
    })
    setTimeout(() => (this.dirty = true), this.settings.MSPFRAME)
    this.world((context) => {
      if (this.grid.enabled) this.renderGrid(this.grid)
      for (const layer of this.layers) {
        if (!layer.visible) continue
        layer.render(context)
        this.renderToScreen({ frameBuffer: layer.framebuffer })
      }
    })
  }

  public stats(): void {
    // console.log(this.regl.stats)
    // console.log('Texture Count: ' + this.regl.stats.textureCount)
    // console.log(
    //   'Texture Memory: ' + Math.round(this.regl.stats.getTotalTextureSize() / 1024 / 1024) + ' MB'
    // )
    // console.log('Render Buffer Count: ' + this.regl.stats.renderbufferCount)
    // console.log(
    //   'Render Buffer Memory: ' +
    //     Math.round(this.regl.stats.getTotalRenderbufferSize() / 1024 / 1024) +
    //     ' MB'
    // )
    // console.log('Buffer Count: ' + this.regl.stats.bufferCount)
    // console.log(
    //   'Buffer Memory: ' + Math.round(this.regl.stats.getTotalBufferSize() / 1024 / 1024) + ' MB'
    // )
  }

  public destroy(): void {
    this.regl.destroy()
  }
}

Comlink.expose(RenderEngineBackend)

export function logMatrix(matrix: mat3): void {
  console.log(
    `${Math.round(matrix[0] * 100) / 100}, ${Math.round(matrix[1] * 100) / 100}, ${Math.round(matrix[2] * 100) / 100
    },\n` +
    `${Math.round(matrix[3] * 100) / 100}, ${Math.round(matrix[4] * 100) / 100}, ${Math.round(matrix[5] * 100) / 100
    },\n` +
    `${Math.round(matrix[6] * 100) / 100}, ${Math.round(matrix[7] * 100) / 100}, ${Math.round(matrix[8] * 100) / 100
    }`
  )
}
