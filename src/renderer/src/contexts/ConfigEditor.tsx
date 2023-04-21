import React from 'react'
import {
  ThemeConfig,
  theme,
} from 'antd'

export interface ThemeContext {
  themeState: ThemeConfig
  setThemeState: React.Dispatch<React.SetStateAction<ThemeConfig>>
  transparency: boolean
  setTransparency: React.Dispatch<React.SetStateAction<boolean>>
  blur: number
}

export const ConfigEditorProvider = React.createContext<ThemeContext>({
  themeState: { algorithm: theme.darkAlgorithm },
  setThemeState: () => {},
  transparency: true,
  setTransparency: () => {},
  blur: 30,
})
