import { createSpotlight, SpotlightActionData } from "@mantine/spotlight"

export const [spotlightStore, spotlight] = createSpotlight()

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
