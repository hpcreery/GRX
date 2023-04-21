import * as Comlink from 'comlink'
// import "./shim.mjs"

Comlink.transferHandlers.set('childAdded', {
  // @ts-ignore
  canHandle: (obj) => obj instanceof Event,
  serialize: () => {
    return [{}, []]
  },
  deserialize: (obj) => obj,
})
