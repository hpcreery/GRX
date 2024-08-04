import './App.css'
import { useRef, useEffect, useState, useContext } from 'react'
import { RenderEngine } from './renderer'
import chroma from 'chroma-js'
import InfoModal from './components/InfoModal'
import Toolbar from './components/Toolbar'
import MousePosition from './components/MousePosition'
import LayerSidebar from './components/LayersSidebar'
import { Box, Center, Loader, Skeleton, useMantineColorScheme, useMantineTheme } from '@mantine/core'
import { ConfigEditorProvider } from './contexts/ConfigEditor'
import { FeatureSidebar } from './components/FeatureSidebar'
import { EngineEvents } from './renderer/engine'
import * as Comlink from 'comlink'
import { notifications } from '@mantine/notifications'

export default function App(): JSX.Element | null {
  const { transparency } = useContext(ConfigEditorProvider)
  const theme = useMantineTheme()
  const colors = useMantineColorScheme()
  const elementRef = useRef<HTMLDivElement>(document.createElement('div'))
  const [renderEngine, setRenderEngine] = useState<RenderEngine>()
  const [ready, setReady] = useState<boolean>(false)

  // Load in the gerber application
  useEffect(() => {
    const Engine = new RenderEngine({ container: elementRef.current })
    setRenderEngine(Engine)
    Engine.onLoad(() => {
      console.log('Engine application loaded', Engine)
      setReady(true)
      Engine.backend.then((backend) => {
        backend.addEventCallback(
          EngineEvents.MESSAGE,
          // pass the Engine here to ensure messages are displayed even before react is ready
          Comlink.proxy(() => msg(Engine))
        )
      })
    })
    return (): void => {
      Engine.destroy()
    }
  }, [])

  // Update the background color of the gerber application
  useEffect(() => {
    if (renderEngine) {
      renderEngine.settings.BACKGROUND_COLOR = chroma(
        colors.colorScheme == 'dark' ? theme.colors.dark[8] : theme.colors.gray[1]
      )
        .alpha(0)
        .rgba()
    }
  }, [colors.colorScheme])

  function msg(engine: RenderEngine): void {
    console.log('Message from gerber backend')
    engine.backend.then((backend) => {
      backend.message.then((m) => {
        notifications.show({
          color: m.level,
          title: m.title,
          message: m.message
        })
      })
    })
  }

  return (
    <>
      {ready && renderEngine ? (
        <Box
          mod={{ transparency }}
          style={{
            width: '100%',
            height: '100%',
            position: 'fixed',
            pointerEvents: 'none',
            zIndex: 10
          }}
        >
          <LayerSidebar renderEngine={renderEngine} />
          <Toolbar renderEngine={renderEngine} />
          <InfoModal />
          <MousePosition renderEngine={renderEngine} />
          <FeatureSidebar renderEngine={renderEngine} />
        </Box>
      ) : (
        <>
          <Center w={'100%'} h={'100%'} mx="auto">
            <Loader />
          </Center>
        </>
      )}
      <Skeleton
        visible={renderEngine == undefined}
        style={{
          width: '100%',
          height: '100%',
          position: 'absolute',
          top: 0,
          left: 0
        }}
      >
        <div
          id="GRX"
          tabIndex={0}
          style={{
            width: '100vw',
            height: '100vh',
            WebkitUserSelect: 'none',
            MozUserSelect: 'none',
            userSelect: 'none',
            touchAction: 'none',
            outline: 'none',
            // backgroundColor: colors.colorScheme == 'dark' ? theme.colors.dark[8] : theme.colors.gray[1]
          }}
          ref={elementRef}
        />
      </Skeleton>
    </>
  )
}
