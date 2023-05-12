import * as Comlink from 'comlink'
import { parse } from '@hpcreery/tracespace-parser'
import { ImageTree, plot } from '@hpcreery/tracespace-plotter'
// import { ImageTree, plot } from '../packages/plotter/src/index'

const workerMethods: WorkerMethods = {
  parseGerber(gerber) {
    const syntaxTree = parse(gerber)
    // console.log('syntaxTree', syntaxTree)
    const imagetree = plot(syntaxTree)
    // console.log('imagetree', imagetree)
    return imagetree
  }
}

Comlink.expose(workerMethods)

export interface WorkerMethods {
  parseGerber(gerber: string): ImageTree
}
