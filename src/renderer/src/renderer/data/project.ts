// import * as Comlink from "comlink"
import { Transform } from '../engine/transform'
import { ArtworkBufferCollection, SurfaceBufferCollection } from './artwork-collections'


export class Matrix {
  public readonly project: Project
  public readonly steps: Step[] = []
  public readonly layers: Layer[] = []
  constructor(project: Project) {
    this.project = project
  }
}

export interface StepAndRepeat {
  repeats: Transform[]
  step: Step
}

export class Layer {
  public readonly matrix: Matrix
  public name: string = ""
  public function: string = "copper"
  public context: string = "default"
  constructor(name: string, matrix: Matrix) {
    this.name = name
    this.matrix = matrix
  }
}

export class Step {
  public readonly matrix: Matrix
  private readonly _layers: StepLayer[] = []
  public get layers(): StepLayer[] {
    this._layers.sort((a, b) => this.matrix.layers.indexOf(a.layer) - this.matrix.layers.indexOf(b.layer));
    return this._layers
  }
  public readonly profile: SurfaceBufferCollection = new SurfaceBufferCollection()
  public readonly step_and_repeats: StepAndRepeat[] = []
  public name: string = ""
  constructor(name: string, matrix: Matrix) {
    this.name = name
    this.matrix = matrix
  }
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
}

export const PROJECTS: Map<string, Project> = new Map<string, Project>()



// export const Interface = {
// }
// Comlink.expose(Interface);

"THIS SECTION IS USED WHEN SHARED WORKER IS ENABLED, BUT NOT USED IN THE CURRENT IMPLEMENTATION"
// console.log('crossOriginIsolated:', crossOriginIsolated);
/**
 * When a connection is made into this shared worker, expose `obj`
 * via the connection `port`.
 */
// @ts-ignore onconnect is a property of SharedWorkerGlobalScope
// onconnect = function (event): void {
//   console.log("Shared worker connected", event);
//   const port = event.ports[0];

//   Comlink.expose(Interface, port);
// };
