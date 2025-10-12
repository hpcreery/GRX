import "./App.css"
import { useRef, useEffect, useState, useContext } from "react"
import { DataInterface, Renderer } from "./renderer"
import chroma from "chroma-js"
import InfoModal from "./components/InfoModal"
import Toolbar from "./components/toolbar/Toolbar"
import MousePosition from "./components/MousePosition"
import LayerSidebar from "./components/layer-sidebar/LayersSidebar"
import { Box, Center, Loader, Skeleton, useMantineColorScheme, useMantineTheme } from "@mantine/core"
import { EditorConfigProvider } from "./contexts/EditorContext"
import { ThemeConfigProvider } from "./contexts/ThemeContext"
import { FeatureSidebar } from "./components/feature-sidebar/FeatureSidebar"
// import { EngineEvents, MessageData } from "./renderer/engine/engine"
// import * as Comlink from "comlink"
import { notifications } from "@mantine/notifications"
import { useContextMenu } from "mantine-contextmenu"
import { menuItems } from "./contexts/EditorContext"
import { useLocalStorage } from "@mantine/hooks"
import { Units } from "./renderer/engine/types"
import { IconPhotoDown } from "@tabler/icons-react"

const PROJECT_NAME = 'main'
const STEP_NAME = 'main'
DataInterface.create_project(PROJECT_NAME)
DataInterface.create_step(PROJECT_NAME, STEP_NAME)

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
    const renderer = new Renderer({ container: elementRef.current })
    renderer.addManagedView(viewRef.current, {
      project: PROJECT_NAME,
      step: STEP_NAME,
    })
    setRenderEngine(renderer)
    setEngineBackgroundColor()
    renderer.onLoad(() => {
      console.log("Engine Application Loaded", renderer)
      setReady(true)
      // renderer.engine.then((engine) => {
      //   engine.addEventCallback(
      //     "main",
      //     EngineEvents.MESSAGE,
      //     Comlink.proxy((e) => msg(e as MessageData)),
      //   )
      // })
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
      renderer.settings.BACKGROUND_COLOR = chroma(colors.colorScheme == "dark" ? theme.colors.dark[8] : theme.colors.gray[1])
        .alpha(0)
        .gl()
    }
  }

  // Update the background color of the render engine
  useEffect(() => {
    setEngineBackgroundColor()
    // removed this use effect deps to ensure background color was set in setup
  })

  // function msg(e: MessageData): void {
  //   notifications.show({
  //     color: e.level,
  //     title: e.title,
  //     message: e.message,
  //   })
  // }

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
            DataInterface: DataInterface,
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
