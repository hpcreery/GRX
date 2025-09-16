import React from "react"
import { ContextMenuItemOptions } from "mantine-contextmenu"
import { Units } from "@src/renderer/engine/types"
import { Renderer } from "@src/renderer"

export interface EditorContext {
  renderer: Renderer
  units: Units
  setUnits: React.Dispatch<React.SetStateAction<Units>>
}

export const EditorConfigProvider = React.createContext<EditorContext>({
  renderer: new Renderer({ container: document.createElement("div") }),
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
