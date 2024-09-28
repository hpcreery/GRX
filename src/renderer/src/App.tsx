import "./App.css"
import { useRef, useEffect, useState, useContext } from "react"
import { RenderEngine } from "./renderer"
import chroma from "chroma-js"
import InfoModal from "./components/InfoModal"
import Toolbar from "./components/toolbar/Toolbar"
import MousePosition from "./components/MousePosition"
import LayerSidebar from "./components/layer-sidebar/LayersSidebar"
import { Box, Center, Loader, Skeleton, useMantineColorScheme, useMantineTheme } from "@mantine/core"
import { ConfigEditorProvider } from "./contexts/ConfigEditor"
import { FeatureSidebar } from "./components/feature-sidebar/FeatureSidebar"
import { EngineEvents, MessageData } from "./renderer/engine"
import * as Comlink from "comlink"
import { notifications } from "@mantine/notifications"
import { useContextMenu } from "mantine-contextmenu"
import { menuItems } from "./contexts/EngineContext"

export default function App(): JSX.Element | null {
  const { transparency } = useContext(EditorConfigProvider)
  const theme = useMantineTheme()
  const colors = useMantineColorScheme()
  const elementRef = useRef<HTMLDivElement>(document.createElement("div"))
  const [renderEngine, setRenderEngine] = useState<RenderEngine>()
  const [ready, setReady] = useState<boolean>(false)
  const { showContextMenu } = useContextMenu()

  // Load in the render engine
  useEffect(() => {
    console.log("Loading Engine Application")
    const Engine = new RenderEngine({ container: elementRef.current })
    setRenderEngine(Engine)
    setEngineBackgroundColor()
    Engine.onLoad(() => {
      console.log("Engine Application Loaded", Engine)
      setReady(true)
      Engine.backend.then((backend) => {
        backend.addEventCallback(
          EngineEvents.MESSAGE,
          Comlink.proxy((e) => msg(e as MessageData)),
        )
      })
    })
    return (): void => {
      Engine.destroy()
    }
  }, [])

  function setEngineBackgroundColor(): void {
    if (renderEngine != undefined) {
      renderEngine.settings.BACKGROUND_COLOR = chroma(colors.colorScheme == "dark" ? theme.colors.dark[8] : theme.colors.gray[1])
        .alpha(0)
        .gl()
    }
  }

  // Update the background color of the render engine
  useEffect(() => {
    setEngineBackgroundColor()
    // removed this use effect deps to ensure background color was set in setup
  })

  function msg(e: MessageData): void {
    notifications.show({
      color: e.level,
      title: e.title,
      message: e.message,
    })
  }

  return (
    <>
      {ready && renderEngine ? (
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
          <LayerSidebar renderEngine={renderEngine} />
          <Toolbar renderEngine={renderEngine} />
          <InfoModal />
          <MousePosition renderEngine={renderEngine} />
          <FeatureSidebar renderEngine={renderEngine} />
        </Box>
      ) : (
        <>
          <Center w={"100%"} h={"100%"} mx="auto">
            <Loader />
          </Center>
        </>
      )}
      <Skeleton
        visible={renderEngine == undefined}
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
        />
      </Skeleton>
    </>
  )
}
