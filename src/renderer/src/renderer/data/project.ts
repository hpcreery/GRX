// import * as Comlink from "comlink"
import { ArtworkBufferCollection } from './artwork-collection'



export interface LayerRowType {
  name: string
  artwork: ArtworkBufferCollection
}

export interface StepColumnType {
  layers: LayerRowType[]
}

export class Matrix {
  public readonly steps: Step[] = []
}


export class Step implements StepColumnType {
  public name: string = ""
  public readonly layers: Layer[] = []
  constructor(name: string) {
    this.name = name
  }
}

export class Layer implements LayerRowType {
  public name: string = ""
  public readonly artwork: ArtworkBufferCollection = new ArtworkBufferCollection()
  constructor(name: string) {
    this.name = name
  }
}

export class Project {
  public name: string = "Untitled Project"
  public created: Date = new Date()
  public modified: Date = new Date()
  public readonly matrix: Matrix = new Matrix()
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
