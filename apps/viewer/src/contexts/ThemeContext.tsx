// import { ColorScheme } from '@mantine/core'
import React from "react"

export interface ThemeContext {
  transparency: boolean
  setTransparency: React.Dispatch<React.SetStateAction<boolean>>
  primaryColor: string
  setPrimaryColor: React.Dispatch<React.SetStateAction<string>>
}

export const ThemeConfigProvider = React.createContext<ThemeContext>({
  transparency: true,
  setTransparency: () => {},
  primaryColor: "teal",
  setPrimaryColor: () => {},
})
