import { ColorScheme } from '@mantine/core'
import React from 'react'

export interface ThemeContext {
  themeMode: ColorScheme
  setThemeMode: React.Dispatch<React.SetStateAction<ColorScheme>>
  transparency: boolean
  setTransparency: React.Dispatch<React.SetStateAction<boolean>>
}

export const ConfigEditorProvider = React.createContext<ThemeContext>({
  themeMode: 'dark',
  setThemeMode: () => {},
  transparency: true,
  setTransparency: () => {}
})
