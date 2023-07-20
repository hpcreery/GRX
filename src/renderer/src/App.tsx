import './App.css'
import { useRef, useEffect, useState } from 'react'
import VirtualGerberApplication from './renderer/virtual'
import chroma from 'chroma-js'
import InfoModal from './components/InfoModal'
import Toolbar from './components/Toolbar'
import MousePosition from './components/MousePosition'
import LayerSidebar from './components/LayersSidebar'
import { Center, Loader, useMantineTheme } from '@mantine/core'
import { GerberAppContextProvider } from './contexts/GerberApp'

export default function App(): JSX.Element | null {

  const theme = useMantineTheme()
  const elementRef = useRef<HTMLDivElement>(document.createElement('div'))
  const [gerberApp, setGerberApp] = useState<VirtualGerberApplication>()

  // Load in the gerber application
  useEffect(() => {
    setGerberApp(
      new VirtualGerberApplication({
        element: elementRef.current,
        antialias: false,
        backgroundColor: chroma(
          theme.colorScheme == 'dark' ? theme.colors.dark[8] : theme.colors.gray[2]
        ).num()
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
        renderer.changeBackgroundColor(
          chroma(theme.colorScheme == 'dark' ? theme.colors.dark[8] : theme.colors.gray[2]).num()
        )
      })
    }
  }, [theme.colorScheme])

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
          <GerberAppContextProvider value={gerberApp}>
            <LayerSidebar />
            <Toolbar />
            <InfoModal />
            <MousePosition />
          </GerberAppContextProvider>
        </div>
      ) : (
        <>
          <Center w={'100%'} h={'100%'} mx="auto">
            <Loader />
          </Center>
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
          backgroundColor: theme.colorScheme == 'dark' ? theme.colors.dark[8] : theme.colors.gray[1]
        }}
        ref={elementRef}
      />
    </>
  )
}
