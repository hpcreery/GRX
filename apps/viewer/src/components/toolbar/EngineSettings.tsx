import { types } from "@grx/engine"
import { Divider, Flex, Kbd, Select, Switch, Text } from "@mantine/core"
import { useHotkeys, useLocalStorage } from "@mantine/hooks"
import { EditorConfigProvider } from "@src/contexts/EditorContext"
import { actions } from "@src/contexts/Spotlight"
import { IconHexagonPlus, IconZoom, IconZoomScan } from "@tabler/icons-react"
import { type JSX, useContext, useEffect } from "react"

type EngineSettingsProps = {}

export default function EngineSettings(_props: EngineSettingsProps): JSX.Element | null {
  const { renderer } = useContext(EditorConfigProvider)
  const [colorBlend, setColorBlend] = useLocalStorage<types.ColorBlend>({
    key: "engine:COLOR_BLEND",
    defaultValue: "Contrast",
  })
  const [zoomToCursor, setZoomToCursor] = useLocalStorage<boolean>({
    key: "engine:ZOOM_TO_CURSOR",
    defaultValue: true,
  })
  const [showDatums, setShowDatums] = useLocalStorage<boolean>({
    key: "engine:SHOW_DATUMS",
    defaultValue: true,
  })
  // const [enable3D, setEnable3D] = useLocalStorage<boolean>({
  //   key: "engine:ENABLE_3D",
  //   defaultValue: false,
  // })
  const [perspective3D, setPerspective3D] = useLocalStorage<boolean>({
    key: "engine:PERSPECTIVE_3D",
    defaultValue: false,
  })

  async function getEngineSettings(): Promise<void> {
    const settings = await renderer.engine.interface.read_engine_settings()
    setColorBlend(settings.COLOR_BLEND)
    setZoomToCursor(settings.ZOOM_TO_CURSOR)
    setShowDatums(settings.SHOW_DATUMS)
  }

  useEffect(() => {
    getEngineSettings()
  }, [])

  useEffect(() => {
    renderer.engine.interface.set_engine_settings({
      COLOR_BLEND: colorBlend,
      ZOOM_TO_CURSOR: zoomToCursor,
      SHOW_DATUMS: showDatums,
      // ENABLE_3D: enable3D,
      PERSPECTIVE_3D: perspective3D,
    })
  }, [colorBlend, zoomToCursor, showDatums, perspective3D])

  useEffect(() => {
    actions.push({
      id: "zoom to cursor off",
      label: "Enable Zoom to Center",
      description: "Disable zoom to cursor",
      onClick: () => setZoomToCursor(false),
      leftSection: <IconZoomScan />,
    })
    actions.push({
      id: "zoom to cursor on",
      label: "Enable Zoom to Cursor",
      description: "Disable zoom to center",
      onClick: () => setZoomToCursor(true),
      leftSection: <IconZoom />,
    })
    actions.push({
      id: "show datums toggle",
      label: "Toggle Datums",
      description: "Toggle view of datums",
      onClick: () => setShowDatums(!showDatums),
      leftSection: <IconHexagonPlus />,
      rightSection: <Kbd>I</Kbd>,
    })
  }, [])

  useHotkeys([
    [
      "i",
      (): void => {
        setShowDatums(!showDatums)
      },
    ],
  ])

  return (
    <>
      <Flex align="center" style={{ width: "100%" }} justify="space-between">
        <Text>Color Blend</Text>
        <Select
          clearable={false}
          data={Object.values(types.ColorBlend)}
          value={colorBlend}
          onChange={(val) => val && setColorBlend(val as types.ColorBlend)}
        />
      </Flex>
      <Divider my="sm" />
      <Flex align="center" style={{ width: "100%" }} justify="space-between">
        <Text>Zoom To Cursor</Text>
        <Switch checked={zoomToCursor} onChange={(event): void => setZoomToCursor(event.currentTarget.checked)} />
      </Flex>
      <Divider my="sm" />
      <Flex align="center" style={{ width: "100%" }} justify="space-between">
        <Text>Show Datums</Text>
        <Switch checked={showDatums} onChange={(event): void => setShowDatums(event.currentTarget.checked)} />
      </Flex>
      <Divider my="sm" />
      <Flex align="center" style={{ width: "100%" }} justify="space-between">
        <Text>3D Perspective View</Text>
        <Switch checked={perspective3D} onChange={(event): void => setPerspective3D(event.currentTarget.checked)} />
      </Flex>
    </>
  )
}
