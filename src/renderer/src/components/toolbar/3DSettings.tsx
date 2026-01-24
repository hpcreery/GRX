import { useEffect, useContext, JSX } from "react"
import { Kbd, SegmentedControl } from "@mantine/core"
import { IconBadge3d, IconPointerPin } from "@tabler/icons-react"
// import { SnapMode, SNAP_MODES } from "@src/renderer/engine/types"
import { useHotkeys, useLocalStorage } from "@mantine/hooks"
import { actions } from "@src/contexts/Spotlight"
import { EditorConfigProvider } from "@src/contexts/EditorContext"

interface ThreeDSettingsProps {}
const ViewModes = ['Off', '3D Orthographic', '3D Perspective'] as const;
type ViewMode = typeof ViewModes[number];

export default function ThreeDSettings(_props: ThreeDSettingsProps): JSX.Element | null {
  const { renderer } = useContext(EditorConfigProvider)
  const [mode, setMode] = useLocalStorage<ViewMode>({
    key: "engine:3D_MODE",
    defaultValue: 'Off',
  })

  async function getModes(): Promise<void> {
    const mode = await renderer.engine.interface.read_engine_settings().then(settings => settings.ENABLE_3D)
    // setEnable3D(mode)
    const pMode = await renderer.engine.interface.read_engine_settings().then(settings => settings.PERSPECTIVE_3D)
    // setPerspective3D(pMode)
    if (!mode) {
      setMode('Off')
    } else {
      if (pMode) {
        setMode('3D Perspective')
      } else {
        setMode('3D Orthographic')
      }
    }
  }

  useEffect(() => {
    getModes()
  }, [])

  useEffect(() => {
    const enable3D = mode !== 'Off'
    const perspective3D = mode === '3D Perspective'
    renderer.engine.interface.set_engine_settings({ ENABLE_3D: enable3D })
    renderer.engine.interface.set_engine_settings({ PERSPECTIVE_3D: perspective3D })
  }, [mode])

  function cycleMode(): ViewMode {
    if (mode === 'Off') {
      return '3D Orthographic'
    } else if (mode === '3D Orthographic') {
      return '3D Perspective'
    } else {
      return 'Off'
    }
  }

  useEffect(() => {
    actions.push({
      id: "toggle 3D mode",
      label: "Toggle 3D Mode",
      description: "Cycle through 3D view modes",
      onClick: () => setMode(cycleMode()),
      leftSection: <IconBadge3d />,
      rightSection: (
        <div dir="ltr">
          <Kbd>T</Kbd>
        </div>
      ),
    })
  }, [])

  useHotkeys([
    [
      "t",
      (): void => setMode(cycleMode()),
    ],
  ])

  return <SegmentedControl radius="sm" value={mode} data={ViewModes.slice()} onChange={(val) => val && setMode(val as ViewMode)} />
}
