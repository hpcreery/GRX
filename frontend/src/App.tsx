import './App.css'
import React, { useRef, useEffect, useState, useLayoutEffect, useMemo } from 'react'
import OffscreenGerberApplication from './renderer/offscreen'
import {
  Button,
  Card,
  ConfigProvider,
  Divider,
  List,
  Modal,
  Space,
  Switch,
  ThemeConfig,
  theme,
  Typography,
  Upload,
  message,
  Tag,
  Popover,
  Badge,
  UploadFile,
  Spin,
} from 'antd'
import chroma from 'chroma-js'
import { ColorSource } from 'pixi.js'
import {
  SearchOutlined,
  DragOutlined,
  CloudDownloadOutlined,
  FullscreenOutlined,
  HomeOutlined,
  LineOutlined,
  ToolOutlined,
  QuestionOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
  PlusOutlined,
  DeleteOutlined,
} from '@ant-design/icons'
import HelpModal from './components/HelpModal'
import Toolbar from './components/Toolbar'
import MousePosition from './components/MousePosition'

import LayerSidebar from './components/LayersSidebar'

const { useToken } = theme
const { Dragger } = Upload
const { Text, Link, Title } = Typography

interface ThemeContext {
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

export default function Main() {
  const data = ['Top Soldermask', 'Top Copper', 'Layer 2', 'Layer 3', 'Layer 4']
  const [themeState, setThemeState] = useState<ThemeConfig>({ algorithm: theme.darkAlgorithm })
  const [transparency, setTransparency] = useState(true)
  const blur = 30
  return (
    <ConfigProvider theme={themeState}>
      <ConfigEditorProvider.Provider
        value={{ themeState, setThemeState, transparency, setTransparency, blur }}>
        <UIElements />
      </ConfigEditorProvider.Provider>
    </ConfigProvider>
  )
}

export function UIElements() {
  const { token } = useToken()
  const elementRef = useRef<HTMLDivElement>(document.createElement('div'))
  const [gerberApp, setGerberApp] = useState<OffscreenGerberApplication>()

  // Load in the gerber application
  useEffect(() => {
    setGerberApp(
      new OffscreenGerberApplication({
        element: elementRef.current,
        antialias: false,
        backgroundColor: chroma(token.colorBgContainer).num(),
      })
    )
    return () => {
      gerberApp && gerberApp.destroy()
      elementRef.current.innerHTML = ''
    }
  }, [])

  // Update the background color of the gerber application
  useEffect(() => {
    if (gerberApp) {
      gerberApp.renderer.then((renderer) => {
        // @ts-ignore
        renderer.renderer.background.color = chroma(token.colorBgContainer).num()
      })
    }
  }, [token.colorBgContainer])

  return (
    <>
      {gerberApp != undefined ? (
        <div
          style={{
            width: '100vw',
            height: '100vh',
            position: 'fixed',
            pointerEvents: 'none',
            zIndex: 10,
          }}>
          <LayerSidebar gerberApp={gerberApp} />
          <Toolbar gerberApp={gerberApp} />
          <HelpModal />
          <MousePosition gerberApp={gerberApp} />
        </div>
      ) : (
        <>
          <Spin
            tip='LOADING...'
            size='large'
            style={{
              width: '100vw',
              height: '100vh',
              position: 'fixed',
              pointerEvents: 'none',
              zIndex: 20,
              marginTop: '45vh',
              backgroundColor: chroma(token.colorBgContainer).css(),
            }}
          />
        </>
      )}
      <div
        id='GRX'
        style={{ width: '100%', height: '100%', cursor: 'crosshair', backgroundColor: chroma(token.colorBgContainer).css(), }}
        ref={elementRef}
      />
    </>
  )
}
