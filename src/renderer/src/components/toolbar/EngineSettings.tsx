import { useEffect } from "react"
import { RenderEngine } from "@src/renderer"
import { Text, Flex, Select, Switch, Divider, Kbd } from "@mantine/core"
import {
  IconZoom,
  IconZoomScan,
  IconHexagonPlus,
  // IconHexagonOff,
} from "@tabler/icons-react"
import { ColorBlend, ColorBlends } from "@src/renderer/engine"
import { useHotkeys, useLocalStorage } from "@mantine/hooks"
import { actions } from "@src/contexts/Spotlight"

interface EngineSettingsProps {
  renderEngine: RenderEngine
}

export default function EngineSettings({ renderEngine }: EngineSettingsProps): JSX.Element | null {
  const [colorBlend, setColorBlend] = useLocalStorage<ColorBlends>({
    key: "engine:COLOR_BLEND",
    defaultValue: renderEngine.settings.COLOR_BLEND,
  })
  const [zoomToCursor, setZoomToCursor] = useLocalStorage<boolean>({
    key: "engine:ZOOM_TO_CURSOR",
    defaultValue: renderEngine.settings.ZOOM_TO_CURSOR,
  })
  const [showDatums, setShowDatums] = useLocalStorage<boolean>({
    key: "engine:SHOW_DATUMS",
    defaultValue: renderEngine.settings.SHOW_DATUMS,
  })

  useEffect(() => {
    renderEngine.settings.COLOR_BLEND = colorBlend
    renderEngine.settings.ZOOM_TO_CURSOR = zoomToCursor
    renderEngine.settings.SHOW_DATUMS = showDatums
  }, [colorBlend, zoomToCursor, showDatums])

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
        <Select clearable={false} data={Object.values(ColorBlend)} value={colorBlend} onChange={(val) => val && setColorBlend(val as ColorBlends)} />
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
    </>
  )
}
