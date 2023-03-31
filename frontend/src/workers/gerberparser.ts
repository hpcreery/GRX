import * as Comlink from 'comlink'
import { parse } from '@hpcreery/tracespace-parser'
import { ImageTree, plot } from '@hpcreery/tracespace-plotter'

const workerMethods: WorkerMethods = {
  parserGerber(gerber: string): ImageTree {
    const syntaxTree = parse(gerber)
    const imagetree = plot(syntaxTree)
    return imagetree
  },
}

Comlink.expose(workerMethods)

export interface WorkerMethods {
  parserGerber(gerber: string): ImageTree
}
