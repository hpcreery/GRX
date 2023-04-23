import './App.css'
import { useRef, useEffect, useState } from 'react'
import VirtualGerberApplication from './renderer/virtual'
import { theme, Spin } from 'antd'
import chroma from 'chroma-js'
import HelpModal from './components/HelpModal'
import Toolbar from './components/Toolbar'
import MousePosition from './components/MousePosition'
import LayerSidebar from './components/LayersSidebar'

const { useToken } = theme

export default function App(): JSX.Element | null {
  const { token } = useToken()
  const elementRef = useRef<HTMLDivElement>(document.createElement('div'))
  const [gerberApp, setGerberApp] = useState<VirtualGerberApplication>()

  // Load in the gerber application
  useEffect(() => {
    setGerberApp(
      new VirtualGerberApplication({
        element: elementRef.current,
        antialias: false,
        backgroundColor: chroma(token.colorBgContainer).num()
      })
    )
    return () => {
      gerberApp && gerberApp.destroy()
    }
  }, [])

  // Update the background color of the gerber application
  useEffect(() => {
    if (gerberApp) {
      gerberApp.renderer.then(async (renderer) => {
        ;(await renderer.renderer).background.color = chroma(token.colorBgContainer).num()
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
            zIndex: 10
          }}
        >
          <LayerSidebar gerberApp={gerberApp} />
          <Toolbar gerberApp={gerberApp} />
          <HelpModal />
          <MousePosition gerberApp={gerberApp} />
        </div>
      ) : (
        <>
          <Spin
            tip="LOADING..."
            size="large"
            style={{
              width: '100vw',
              height: '100vh',
              position: 'fixed',
              pointerEvents: 'none',
              zIndex: 20,
              marginTop: '45vh',
              backgroundColor: chroma(token.colorBgContainer).css()
            }}
          />
        </>
      )}
      <div
        id="GRX"
        style={{
          width: '100%',
          height: '100%',
          cursor: 'crosshair',
          backgroundColor: chroma(token.colorBgContainer).css()
        }}
        ref={elementRef}
      />
    </>
  )
}
