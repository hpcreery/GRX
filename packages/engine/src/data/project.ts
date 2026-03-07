// import * as Comlink from "comlink"
import type { Transform } from "@src/transform"
import { ArtworkBufferCollection, SurfaceBufferCollection } from "./artwork-collections"
import type * as Shapes from "./shape/shape"

export const PROJECTS: Map<string, Project> = new Map<string, Project>()

export interface ProjectJSON {
  name: string
  created: string
  modified: string
  matrix: MatrixJSON
}

export class Project {
  public name: string = "Untitled Project"
  public created: Date = new Date()
  public modified: Date = new Date()
  public readonly matrix: Matrix = new Matrix(this)
  constructor(name: string) {
    this.name = name
    this.created = new Date()
    this.modified = new Date()
  }

  toJSON(): ProjectJSON {
    return {
      name: this.name,
      created: this.created.toISOString(),
      modified: this.modified.toISOString(),
      matrix: this.matrix.toJSON(),
    }
  }
}

export interface MatrixJSON {
  steps: StepJSON[]
  layers: LayerJSON[]
}

export class Matrix {
  public readonly project: Project
  public readonly steps: Step[] = []
  public readonly layers: Layer[] = []
  constructor(project: Project) {
    this.project = project
  }

  getZOffsetForLayer(targetLayer: Layer): number {
    let zOffset = 0
    for (const layer of this.layers.toReversed()) {
      if (layer === targetLayer) {
        return zOffset
      }
      zOffset += layer.thickness
    }
    return zOffset
  }

  toJSON(): MatrixJSON {
    return {
      steps: this.steps.map((step) => step.toJSON()),
      layers: this.layers.map((layer) => layer.toJSON()),
    }
  }
}

export interface LayerJSON {
  name: string
  function: string
  context: string
}

export class Layer {
  public readonly matrix: Matrix
  public name: string = ""
  public function: string = "copper"
  public context: string = "default"
  public thickness: number = 0.0005 // in mm
  constructor(name: string, matrix: Matrix) {
    this.name = name
    this.matrix = matrix
  }

  toJSON(): LayerJSON {
    return {
      name: this.name,
      function: this.function,
      context: this.context,
    }
  }
}

export interface StepAndRepeatJSON {
  repeats: Transform[]
  step: string
}

// maybe convert this to a class?
export interface StepAndRepeat {
  repeats: Transform[]
  step: Step
}

export interface StepJSON {
  name: string
  layers: StepLayerJSON[]
  profile: Shapes.Shape[]
  step_and_repeats: StepAndRepeatJSON[]
}

export class Step {
  public readonly matrix: Matrix
  private readonly _layers: StepLayer[] = []
  public get layers(): StepLayer[] {
    this._layers.sort((a, b) => this.matrix.layers.indexOf(a.layer) - this.matrix.layers.indexOf(b.layer))
    return this._layers
  }
  public readonly profile: SurfaceBufferCollection = new SurfaceBufferCollection()
  public readonly step_and_repeats: StepAndRepeat[] = []
  public name: string = ""
  constructor(name: string, matrix: Matrix) {
    this.name = name
    this.matrix = matrix
  }

  toJSON(): StepJSON {
    return {
      name: this.name,
      layers: this.layers.map((layer) => layer.toJSON()),
      profile: this.profile.toJSON(),
      step_and_repeats: this.step_and_repeats.map((sar) => ({
        repeats: sar.repeats,
        step: sar.step.name,
      })),
    }
  }
}

export interface StepLayerJSON {
  layer: LayerJSON
  artwork: Shapes.Shape[]
  profile: Shapes.Surface[]
}

export class StepLayer {
  public readonly layer: Layer
  public readonly step: Step
  public readonly artwork: ArtworkBufferCollection = new ArtworkBufferCollection()
  public readonly profile: SurfaceBufferCollection = new SurfaceBufferCollection()
  constructor(step: Step, row: Layer) {
    this.step = step
    this.layer = row
  }

  toJSON(): StepLayerJSON {
    return {
      layer: this.layer.toJSON(),
      artwork: this.artwork.toJSON(),
      profile: this.profile.toJSON(),
    }
  }
}
// export const TEST = {
// }
// export abstract class TEST {
//   public static A = '1'
//   private static B = '2'
//   public static goB(): string {
//     return TEST.B
//   }
// }
// Comlink.expose(TEST);

;("THIS SECTION IS USED WHEN SHARED WORKER IS ENABLED, BUT NOT USED IN THE CURRENT IMPLEMENTATION")
// console.log('crossOriginIsolated:', crossOriginIsolated);
/**
 * When a connection is made into this shared worker, expose `obj`
 * via the connection `port`.
 */
// onconnect = function (event): void {
//   console.log("Shared worker connected", event);
//   const port = event.ports[0];

//   Comlink.expose(Interface, port);
// };
