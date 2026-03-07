import { Renderer, type types } from "@grx/engine"
import type { ContextMenuItemOptions } from "mantine-contextmenu"
import React from "react"

export interface EditorContext {
  renderer: Renderer
  project: {
    name: string
    stepName: string
  }
  units: types.Units
  setUnits: React.Dispatch<React.SetStateAction<types.Units>>
}

export const EditorConfigProvider = React.createContext<EditorContext>({
  renderer: new Renderer({ container: document.createElement("div") }),
  project: { name: "main", stepName: "main" },
  units: "mm",
  setUnits: () => {},
})

export const menuItemsBase: ContextMenuItemOptions[] = []

export const menuItems = new Proxy(menuItemsBase, {
  get(target, prop): ContextMenuItemOptions | ((...t: ContextMenuItemOptions[]) => number) {
    if (prop === "push") {
      return (...args): number => {
        if (target.find((item) => item.key === args[0].key)) {
          target = target.filter((item) => item.key !== args[0].key)
        }
        return target[prop](...args)
      }
    }
    return target[prop]
  },
})
