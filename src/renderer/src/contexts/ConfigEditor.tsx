import React from 'react'
import { ThemeConfig } from 'antd'

export interface ThemeContext {
  themeState: ThemeConfig
  setThemeState: React.Dispatch<React.SetStateAction<ThemeConfig>>
  themeMode: 'light' | 'dark'
  setThemeMode: React.Dispatch<React.SetStateAction<'light' | 'dark'>>
  transparency: boolean
  setTransparency: React.Dispatch<React.SetStateAction<boolean>>
  blur: number
  componentSize: 'small' | 'middle' | 'large'
  setComponentSize: React.Dispatch<React.SetStateAction<'small' | 'middle' | 'large'>>
}

export const ConfigEditorProvider = React.createContext<ThemeContext>({
  themeState: {},
  setThemeState: () => {},
  themeMode: 'dark',
  setThemeMode: () => {},
  transparency: true,
  setTransparency: () => {},
  blur: 30,
  componentSize: 'middle',
  setComponentSize: () => {}
})