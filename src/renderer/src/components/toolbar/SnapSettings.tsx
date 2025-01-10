import { useEffect, useContext } from "react"
import { Kbd, SegmentedControl } from "@mantine/core"
import { IconPointerPin } from "@tabler/icons-react"
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
      rightSection: (
        <div dir="ltr">
          <Kbd>Shift</Kbd> + <Kbd>O</Kbd>
        </div>
      ),
    })
    actions.push({
      id: "snap edge",
      label: "Snap To Edge",
      description: "Snap to edge of objects",
      onClick: () => setSnapMode(SnapMode.EDGE),
      leftSection: <IconPointerPin />,
      rightSection: (
        <div dir="ltr">
          <Kbd>Shift</Kbd> + <Kbd>E</Kbd>
        </div>
      ),
    })
    actions.push({
      id: "snap center",
      label: "Snap To Center",
      description: "Snap to center of objects",
      onClick: () => setSnapMode(SnapMode.CENTER),
      leftSection: <IconPointerPin />,
      rightSection: (
        <div dir="ltr">
          <Kbd>Shift</Kbd> + <Kbd>C</Kbd>
        </div>
      ),
    })
  }, [])

  useHotkeys([
    [
      "shift + o",
      (): void => {
        setSnapMode(SnapMode.OFF)
      },
    ],
    [
      "shift + e",
      (): void => {
        setSnapMode(SnapMode.EDGE)
      },
    ],
    [
      "shift + c",
      (): void => {
        setSnapMode(SnapMode.CENTER)
      },
    ],
  ])

  return <SegmentedControl radius="sm" value={snapMode} data={SNAP_MODES} onChange={(val) => val && setSnapMode(val as SnapMode)} />
}
