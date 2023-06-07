import * as Comlink from 'comlink'
import { parse } from '@hpcreery/tracespace-parser'
import { ImageTree, plot } from '@hpcreery/tracespace-plotter'

const workerMethods: WorkerMethods = {
  parseGerber(gerber) {
    // console.log('starting parse')
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
