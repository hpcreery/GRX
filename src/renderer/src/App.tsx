import './App.css'
import { useRef, useEffect, useState, useContext } from 'react'
import { RenderEngine } from './renderer'
import chroma from 'chroma-js'
import InfoModal from './components/InfoModal'
import Toolbar from './components/Toolbar'
import MousePosition from './components/MousePosition'
import LayerSidebar from './components/LayersSidebar'
import { Box, Center, Loader, Skeleton, useMantineColorScheme, useMantineTheme, Button } from '@mantine/core'
import { ConfigEditorProvider } from './contexts/ConfigEditor'
import { FeatureSidebar } from './components/FeatureSidebar'

export default function App(): JSX.Element | null {
  const { transparency } = useContext(ConfigEditorProvider)
  const theme = useMantineTheme()
  const colors = useMantineColorScheme()
  const elementRef = useRef<HTMLDivElement>(document.createElement('div'))
  const [renderEngine, setRenderEngine] = useState<RenderEngine>()

  // Load in the gerber application
  useEffect(() => {
    const Engine = new RenderEngine({ container: elementRef.current })
    setRenderEngine(Engine)
    return () => {
      Engine.destroy()
    }
  }, [])

  // Update the background color of the gerber application
  useEffect(() => {
    if (renderEngine) {
      renderEngine.settings.BACKGROUND_COLOR = chroma(colors.colorScheme == 'dark' ? theme.colors.dark[8] : theme.colors.gray[1]).alpha(0).rgba()
    }
  }, [colors.colorScheme])

  return (
    <>
      {renderEngine != undefined ? (
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
      <Skeleton visible={renderEngine == undefined} style={{
        width: '100%',
        height: '100%',
        position: 'absolute',
        top: 0,
        left: 0,
      }}>

        <div
          id="GRX"
          style={{
            width: '100vw',
            height: '100vh',
            WebkitUserSelect: 'none',
            MozUserSelect: 'none',
            userSelect: 'none',
            touchAction: 'none',
            // backgroundColor: colors.colorScheme == 'dark' ? theme.colors.dark[8] : theme.colors.gray[1]
          }}
          
          ref={elementRef}
        />
      </Skeleton>
    </>
  )
}
