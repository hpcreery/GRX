import { Kbd, SegmentedControl } from "@mantine/core"
import { useHotkeys, useLocalStorage } from "@mantine/hooks"
import { EditorConfigProvider } from "@src/contexts/EditorContext"
import { actions } from "@src/contexts/Spotlight"
import { IconBadge3d } from "@tabler/icons-react"
import { type JSX, useContext, useEffect } from "react"

type ThreeDSettingsProps = {}
const ViewModes = ["Off", "3D Orthographic", "3D Perspective"] as const
type ViewMode = (typeof ViewModes)[number]

export default function ThreeDSettings(_props: ThreeDSettingsProps): JSX.Element | null {
  const { renderer } = useContext(EditorConfigProvider)
  const [mode, setMode] = useLocalStorage<ViewMode>({
    key: "engine:3D_MODE",
    defaultValue: "Off",
  })

  async function getModes(): Promise<void> {
    const mode = await renderer.engine.interface.read_engine_settings().then((settings) => settings.ENABLE_3D)
    const pMode = await renderer.engine.interface.read_engine_settings().then((settings) => settings.PERSPECTIVE_3D)
    if (!mode) {
      setMode("Off")
    } else {
      if (pMode) {
        setMode("3D Perspective")
      } else {
        setMode("3D Orthographic")
      }
    }
  }

  useEffect(() => {
    getModes()
  }, [])

  useEffect(() => {
    const enable3D = mode !== "Off"
    const perspective3D = mode === "3D Perspective"
    renderer.engine.interface.set_engine_settings({ ENABLE_3D: enable3D })
    renderer.engine.interface.set_engine_settings({ PERSPECTIVE_3D: perspective3D })
  }, [mode])

  // const cycleMode = (): ViewMode => {
  //   if (mode === 'Off') {
  //     return '3D Orthographic'
  //   } else if (mode === '3D Orthographic') {
  //     return '3D Perspective'
  //   } else {
  //     return 'Off'
  //   }
  // }

  useEffect(() => {
    actions.push({
      id: "toggle 3D orthographic mode",
      label: "Toggle 3D Orthographic Mode",
      description: "Switch to 3D Orthographic view",
      onClick: () => setMode("3D Orthographic"),
      leftSection: <IconBadge3d />,
      rightSection: (
        <div dir="ltr">
          <Kbd>Alt</Kbd> + <Kbd>O</Kbd>
        </div>
      ),
    })
    actions.push({
      id: "toggle 3D perspective mode",
      label: "Toggle 3D Perspective Mode",
      description: "Switch to 3D perspective view",
      onClick: () => setMode("3D Perspective"),
      leftSection: <IconBadge3d />,
      rightSection: (
        <div dir="ltr">
          <Kbd>Alt</Kbd> + <Kbd>P</Kbd>
        </div>
      ),
    })
    actions.push({
      id: "toggle 3D off mode",
      label: "Toggle 3D Mode Off",
      description: "Turn off 3D view",
      onClick: () => setMode("Off"),
      leftSection: <IconBadge3d />,
      rightSection: (
        <div dir="ltr">
          <Kbd>Alt</Kbd> + <Kbd>I</Kbd>
        </div>
      ),
    })
  }, [])

  useHotkeys([
    ["alt+o", (): void => setMode("3D Orthographic"), { usePhysicalKeys: true, preventDefault: true }],
    ["alt+p", (): void => setMode("3D Perspective"), { usePhysicalKeys: true, preventDefault: true }],
    ["alt+i", (): void => setMode("Off"), { usePhysicalKeys: true, preventDefault: true }],
  ])

  return <SegmentedControl radius="sm" value={mode} data={ViewModes.slice()} onChange={(val) => val && setMode(val as ViewMode)} />
}
