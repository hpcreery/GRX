// import { ColorScheme } from '@mantine/core'
import React from 'react'
import { Units } from '@src/renderer/types'

export interface ThemeContext {
  transparency: boolean
  setTransparency: React.Dispatch<React.SetStateAction<boolean>>
  primaryColor: string
  setPrimaryColor: React.Dispatch<React.SetStateAction<string>>
  units: Units
  setUnits: React.Dispatch<React.SetStateAction<Units>>
}

export const ConfigEditorProvider = React.createContext<ThemeContext>({
  transparency: true,
  setTransparency: () => {},
  primaryColor: 'teal',
  setPrimaryColor: () => {},
  units: 'mm',
  setUnits: () => {}
})
