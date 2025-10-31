import "./App.css"
import { useRef, useEffect, useState, useContext, JSX } from "react"
import { Renderer } from "./renderer"
import chroma from "chroma-js"
import InfoModal from "./components/InfoModal"
import Toolbar from "./components/toolbar/Toolbar"
import MousePosition from "./components/MousePosition"
import LayerSidebar from "./components/layer-sidebar/LayersSidebar"
import { Box, Center, Loader, Skeleton, useMantineColorScheme, useMantineTheme } from "@mantine/core"
import { EditorConfigProvider } from "./contexts/EditorContext"
import { ThemeConfigProvider } from "./contexts/ThemeContext"
import { FeatureSidebar } from "./components/feature-sidebar/FeatureSidebar"
import { useContextMenu } from "mantine-contextmenu"
import { menuItems } from "./contexts/EditorContext"
import { useLocalStorage } from "@mantine/hooks"
import { Units } from "./renderer/engine/types"
import { IconPhotoDown } from "@tabler/icons-react"

const PROJECT_NAME = "main"
const STEP_NAME = "main"

export default function App(): JSX.Element | null {
  const { transparency } = useContext(ThemeConfigProvider)
  const theme = useMantineTheme()
  const colors = useMantineColorScheme()
  const elementRef = useRef<HTMLDivElement>(document.createElement("div"))
  const viewRef = useRef<HTMLDivElement>(document.createElement("div"))
  const [renderer, setRenderEngine] = useState<Renderer>()
  const [ready, setReady] = useState<boolean>(false)
  const { showContextMenu } = useContextMenu()

  // Load in the render engine
  useEffect(() => {
    console.log("Loading Engine Application")
    const renderer = new Renderer({ container: elementRef.current, attributes: { powerPreference: "high-performance", antialias: false } })
    renderer.interface.create_project(PROJECT_NAME)
    renderer.interface.create_step(PROJECT_NAME, STEP_NAME)
    renderer.addManagedView(viewRef.current, {
      project: PROJECT_NAME,
      step: STEP_NAME,
    })
    setRenderEngine(renderer)
    setEngineBackgroundColor()
    renderer.onLoad(() => {
      console.log("Engine Application Loaded", renderer)
      setReady(true)
      menuItems.push({
        key: "download-canvas",
        icon: <IconPhotoDown stroke={1.5} size={18} />,
        title: "Download Screensot",
        onClick: () => renderer.downloadImage(),
      })
    })
    return (): void => {
      renderer.destroy()
    }
  }, [])

  function setEngineBackgroundColor(): void {
    if (renderer != undefined) {
      const color = chroma(colors.colorScheme == "dark" ? theme.colors.dark[8] : theme.colors.gray[1])
        .alpha(0)
        .gl()
      renderer.engine.interface.set_engine_settings({ BACKGROUND_COLOR: color })
    }
  }

  // Update the background color of the render engine
  useEffect(() => {
    setEngineBackgroundColor()
    // removed this use effect deps to ensure background color was set in setup
  })

  const [units, setUnits] = useLocalStorage<Units>({
    key: "units",
    defaultValue: "mm",
  })

  return (
    <>
      {ready && renderer ? (
        <EditorConfigProvider.Provider
          value={{
            renderer: renderer,
            project: { name: PROJECT_NAME, stepName: STEP_NAME },
            units: units,
            setUnits: setUnits,
          }}
        >
          <Box
            mod={{ transparency }}
            style={{
              width: "100%",
              height: "100%",
              position: "fixed",
              pointerEvents: "none",
              zIndex: 10,
            }}
          >
            <LayerSidebar />
            <Toolbar />
            <InfoModal />
            <MousePosition />
            <FeatureSidebar />
          </Box>
        </EditorConfigProvider.Provider>
      ) : (
        <>
          <Center w={"100%"} h={"100%"} mx="auto">
            <Loader />
          </Center>
        </>
      )}
      <Skeleton
        visible={renderer == undefined}
        style={{
          width: "100%",
          height: "100%",
          position: "absolute",
          top: 0,
          left: 0,
        }}
      >
        <div
          id="GRX"
          tabIndex={0}
          style={{
            width: "100vw",
            height: "100vh",
            WebkitUserSelect: "none",
            MozUserSelect: "none",
            userSelect: "none",
            touchAction: "none",
            outline: "none",
            // backgroundColor: colors.colorScheme == 'dark' ? theme.colors.dark[8] : theme.colors.gray[1]
          }}
          onContextMenu={showContextMenu(menuItems)}
          ref={elementRef}
        >
          <div
            id="main"
            ref={viewRef}
            style={{
              width: "100%",
              height: "100%",
              pointerEvents: "all",
              position: "relative",
            }}
          />
        </div>
      </Skeleton>
    </>
  )
}
