import './App.css'
import { useRef, useEffect, useState, useContext } from 'react'
import VirtualGerberApplication from './renderer/virtual'
import { theme, Spin } from 'antd'
import chroma from 'chroma-js'
import InfoModal from './components/InfoModal'
import Toolbar from './components/Toolbar'
import MousePosition from './components/MousePosition'
import LayerSidebar from './components/LayersSidebar'
import { Global, css } from '@emotion/react'
import { ConfigEditorProvider } from './contexts/ConfigEditor'

const { useToken } = theme

export default function App(): JSX.Element | null {
  const { token } = useToken()
  const elementRef = useRef<HTMLDivElement>(document.createElement('div'))
  const [gerberApp, setGerberApp] = useState<VirtualGerberApplication>()
  const { transparency, blur } = useContext(ConfigEditorProvider)

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
        renderer.changeBackgroundColor(chroma(token.colorBgContainer).num())
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
          <InfoModal />
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
          WebkitUserSelect: 'none',
          MozUserSelect: 'none',
          userSelect: 'none',
          touchAction: 'none',
          backgroundColor: chroma(token.colorBgContainer).css()
        }}
        ref={elementRef}
      />
      <Global
        styles={css`
          .ant-dropdown > ul {
            backdrop-filter: ${transparency ? `blur(${blur}px)` : ''} !important;
            background-color: ${transparency
              ? chroma(token.colorBgElevated).alpha(0.7).css()
              : chroma(token.colorBgElevated).css()} !important;
          }
          .ant-popover-content > div {
            backdrop-filter: ${transparency ? `blur(${blur}px)` : ''} !important;
            background-color: ${transparency
              ? chroma(token.colorBgElevated).alpha(0.7).css()
              : chroma(token.colorBgElevated).css()} !important;
          }
        `}
      />
    </>
  )
}
