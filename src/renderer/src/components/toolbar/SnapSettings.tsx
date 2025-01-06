import { useEffect, useContext } from "react"
import { Text, Flex, Kbd, SegmentedControl } from "@mantine/core"
import {
  // IconZoom,
  // IconZoomScan,
  // IconHexagonPlus,
  IconPointerPin,
  // IconHexagonOff,
} from "@tabler/icons-react"
import { SnapMode, SNAP_MODES } from "@src/renderer/types"
import { useHotkeys, useLocalStorage } from "@mantine/hooks"
import { actions } from "@src/contexts/Spotlight"
import { EditorConfigProvider } from "@src/contexts/EditorContext"

interface SnapSettingsProps {}

export default function SnapSettings(_props: SnapSettingsProps): JSX.Element | null {
  const { renderEngine } = useContext(EditorConfigProvider)
  const [snapMode, setSnapMode] = useLocalStorage<SnapMode>({
    key: "engine:SNAP_MODE",
    defaultValue: renderEngine.settings.SNAP_MODE,
  })

  useEffect(() => {
    renderEngine.settings.SNAP_MODE = snapMode
  }, [snapMode])

  useEffect(() => {
    actions.push({
      id: "snap off",
      label: "Disable Snap",
      description: "Disable snapping",
      onClick: () => setSnapMode(SnapMode.OFF),
      leftSection: <IconPointerPin />,
    })
    actions.push({
      id: "snap edge",
      label: "Snap To Edge",
      description: "Snap to edge of objects",
      onClick: () => setSnapMode(SnapMode.EDGE),
      leftSection: <IconPointerPin />,
    })
    actions.push({
      id: "snap center",
      label: "Snap To Center",
      description: "Snap to center of objects",
      onClick: () => setSnapMode(SnapMode.CENTER),
      leftSection: <IconPointerPin />,
      rightSection: <Kbd>I</Kbd>,
    })
  }, [])

  useHotkeys([
    [
      "shift + s + o",
      (): void => {
        setSnapMode(SnapMode.OFF)
      },
    ],
    [
      "shift + s + e",
      (): void => {
        setSnapMode(SnapMode.EDGE)
      },
    ],
    [
      "shift + s + c",
      (): void => {
        setSnapMode(SnapMode.CENTER)
      },
    ],
  ])

  return (
    <>
      <Flex align="center" style={{ width: "100%" }} justify="space-between">
        <Text>Snap Mode</Text>
        <SegmentedControl value={snapMode} data={SNAP_MODES} onChange={(val) => val && setSnapMode(val as SnapMode)} />
        {/* <Select clearable={false} data={SNAP_MODES} value={snapMode} onChange={(val) => val && setSnapMode(val as SnapMode)} /> */}
      </Flex>
      {/* <Divider my="sm" /> */}
      {/* <Flex align="center" style={{ width: "100%" }} justify="space-between">
        <Text>Zoom To Cursor</Text>
        <Switch checked={zoomToCursor} onChange={(event): void => setZoomToCursor(event.currentTarget.checked)} />
      </Flex>
      <Divider my="sm" />
      <Flex align="center" style={{ width: "100%" }} justify="space-between">
        <Text>Show Datums</Text>
        <Switch checked={showDatums} onChange={(event): void => setShowDatums(event.currentTarget.checked)} />
      </Flex> */}
    </>
  )
}
