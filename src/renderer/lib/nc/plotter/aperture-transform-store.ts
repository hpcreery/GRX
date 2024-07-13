import type { ChildNode } from '../parser/tree'

export interface ApertureTransform {
}

export interface TransformStore {
  use: (node: ChildNode) => ApertureTransform
}

export function createTransformStore(): TransformStore {
  return Object.create(TransformStorePrototype)
}

interface TransformStoreState {
  _currentTransform: ApertureTransform
}

const TransformStorePrototype: TransformStore & TransformStoreState = {
  _currentTransform: {
  },

  use(_node: ChildNode): ApertureTransform {
    return this._currentTransform
  }
}
