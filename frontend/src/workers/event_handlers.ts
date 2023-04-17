import * as Comlink from 'comlink'

Comlink.transferHandlers.set('childAdded', {
  // @ts-ignore
  canHandle: (obj) => obj instanceof Event,
  serialize: () => {
    return [{}, []]
  },
  deserialize: (obj) => obj,
})
