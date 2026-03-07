import { createSpotlight, type SpotlightActionData, type SpotlightState } from "@mantine/spotlight"
import type { MantineStore } from "@mantine/store"

export const [spotlightStore, spotlight]: readonly [MantineStore<SpotlightState>, { open: () => void; close: () => void; toggle: () => void }] =
  createSpotlight()

export const actionsBase: SpotlightActionData[] = []

export const actions = new Proxy(actionsBase, {
  get(target, prop): SpotlightActionData | ((...t: SpotlightActionData[]) => number) {
    if (prop === "push") {
      return (...args): number => {
        if (target.find((item) => item.id === args[0].id)) {
          target = target.filter((item) => item.id !== args[0].id)
        }
        return target[prop](...args)
      }
    }
    return target[prop]
  },
})
