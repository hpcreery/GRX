// import { ColorScheme } from '@mantine/core'
import React from 'react'
import { Units } from '@src/renderer/types'

export interface ThemeContext {
  transparency: boolean
  setTransparency: React.Dispatch<React.SetStateAction<boolean>>
  primaryColor: string
  setPrimaryColor: React.Dispatch<React.SetStateAction<string>>
}

export interface EditorContext {
  units: Units
  setUnits: React.Dispatch<React.SetStateAction<Units>>
}

export const EditorConfigProvider = React.createContext<EditorContext>({
  units: 'mm',
  setUnits: () => {}
})

export const ThemeConfigProvider = React.createContext<ThemeContext>({
  transparency: true,
  setTransparency: () => {},
  primaryColor: 'teal',
  setPrimaryColor: () => {},
})
