import React from "react"
import {
  IconArrowsMove,
  IconRulerMeasure,
  // IconZoomIn,
  // IconZoomOut,
  // IconHome,
  IconAdjustments,
  IconCube3dSphere,
  // IconCube3dSphereOff,
  IconCube,
  // IconGridDots,
  IconGrid4x4,
  IconClick,
  IconZoomReset,
  IconTrashX,
  IconEngine,
  IconPointerPin,
  IconBone,
  IconBoneOff,
} from "@tabler/icons-react"
// import chroma from 'chroma-js'
import { Modal, ActionIcon, Card, Group, Tooltip, useMantineTheme, Kbd, Popover } from "@mantine/core"
import { useDisclosure, useHotkeys } from "@mantine/hooks"
import GeneralSettings from "./GeneralSettings"
import GridSettings from "./GridSettings"
import EngineSettings from "./EngineSettings"
import type { PointerSettings } from "@src/renderer"
import { useContextMenu } from "mantine-contextmenu"
import { EditorConfigProvider } from "@src/contexts/EditorContext"
import { actions } from "@src/contexts/Spotlight"
import { menuItems } from "@src/contexts/EditorContext"
import { PointerMode } from "@src/renderer/engine/types"
import SnapSettings from "./SnapSettings"

interface ToolbarProps {}

export default function Toolbar(_props: ToolbarProps): JSX.Element | null {
  const { units, renderer } = React.useContext(EditorConfigProvider)
  const [settingsModalOpen, { open, close }] = useDisclosure(false)
  const [gridSettingsModal, gridSettingsModalHandlers] = useDisclosure(false)
  const [engineSettingsModal, engineSettingsModalHandlers] = useDisclosure(false)
  const [snapSettingsModal, snapSettingsModalHandlers] = useDisclosure(false)
  const [outlineMode, setOutlineMode] = React.useState<boolean>(renderer.settings.OUTLINE_MODE)
  const [skeletonMode, setSkeletonMode] = React.useState<boolean>(renderer.settings.SKELETON_MODE)
  // const [gridMode, setGridMode] = React.useState<'dots' | 'lines'>(renderer.grid.type)
  const [pointerMode, setPointerMode] = React.useState<PointerSettings["mode"]>(renderer.pointerSettings.mode)
  const { showContextMenu } = useContextMenu()
  const theme = useMantineTheme()

  React.useEffect(() => {
    menuItems.push({
      key: "clear measurements",
      title: "Clear Measurements",
      icon: <IconTrashX stroke={1.5} size={18} color={theme.colors.red[7]} />,
      onClick: async (): Promise<void> => {
        const engine = await renderer.engine
        engine.clearMeasurements("main")
      },
    })
    actions.push({
      id: "outline mode off",
      label: "Disable Outline Mode",
      description: "Default fill mode",
      onClick: () => {
        renderer.settings.OUTLINE_MODE = false
        setOutlineMode(false)
      },
      leftSection: <IconCube />,
      rightSection: <Kbd>O</Kbd>,
    })
    actions.push({
      id: "outline mode on",
      label: "Enable Outline Mode",
      description: "Show outline of all features",
      onClick: () => {
        renderer.settings.OUTLINE_MODE = true
        setOutlineMode(true)
      },
      leftSection: <IconCube3dSphere />,
      rightSection: <Kbd>O</Kbd>,
    })
    actions.push({
      id: "skeleton mode off",
      label: "Disable Skeleton Mode",
      description: "Default fill mode",
      onClick: () => {
        renderer.settings.SKELETON_MODE = false
        setSkeletonMode(false)
      },
      leftSection: <IconBoneOff />,
      rightSection: <Kbd>P</Kbd>,
    })
    actions.push({
      id: "skeleton mode on",
      label: "Enable Skeleton Mode",
      description: "Show skeleton of all lines and arcs, outline of the rest of feature types",
      onClick: () => {
        renderer.settings.SKELETON_MODE = true
        setSkeletonMode(true)
      },
      leftSection: <IconBone />,
      rightSection: <Kbd>P</Kbd>,
    })
    actions.push({
      id: "open settings modal",
      label: "Open Settings",
      description: "Show general settings",
      onClick: open,
      leftSection: <IconAdjustments />,
      // rightSection: <Kbd></Kbd>
    })
    actions.push({
      id: "open grid settings modal",
      label: "Open Grid Settings",
      description: "Show grid settings",
      onClick: gridSettingsModalHandlers.open,
      leftSection: <IconGrid4x4 />,
      // rightSection: <Kbd>A</Kbd>
    })
    actions.push({
      id: "open engine settings modal",
      label: "Open Engine Settings",
      description: "Show engine settings",
      onClick: engineSettingsModalHandlers.open,
      leftSection: <IconEngine />,
      // rightSection: <Kbd>A</Kbd>
    })
    actions.push({
      id: "clear measurements",
      label: "Clear Measurements",
      description: "Delete and remove all measurements",
      onClick: async (): Promise<void> => {
        const engine = await renderer.engine
        engine.clearMeasurements("main")
      },
      leftSection: <IconTrashX />,
      // rightSection: <Kbd>A</Kbd>
    })
    actions.push({
      id: "mouse move mode",
      label: "Mouse Move Mode",
      description: "Enable mouse move mode",
      onClick: () => {
        renderer.pointerSettings.mode = PointerMode.MOVE
        setPointerMode(PointerMode.MOVE)
      },
      leftSection: <IconArrowsMove />,
      rightSection: <Kbd>A</Kbd>,
    })
    actions.push({
      id: "mouse select mode",
      label: "Mouse Select Mode",
      description: "Enable mouse select mode",
      onClick: () => {
        renderer.pointerSettings.mode = PointerMode.SELECT
        setPointerMode(PointerMode.SELECT)
      },
      leftSection: <IconClick />,
      rightSection: <Kbd>S</Kbd>,
    })
    actions.push({
      id: "mouse measure mode",
      label: "Mouse Measure Mode",
      description: "Enable mouse measure mode",
      onClick: () => {
        renderer.pointerSettings.mode = PointerMode.MEASURE
        setPointerMode(PointerMode.MEASURE)
      },
      leftSection: <IconRulerMeasure />,
      rightSection: <Kbd>D</Kbd>,
    })
  }, [])

  useHotkeys([
    [
      "a",
      (): void => {
        renderer.pointerSettings.mode = PointerMode.MOVE
        setPointerMode(PointerMode.MOVE)
      },
    ],
    [
      "s",
      (): void => {
        renderer.pointerSettings.mode = PointerMode.SELECT
        setPointerMode(PointerMode.SELECT)
      },
    ],
    [
      "d",
      (): void => {
        renderer.pointerSettings.mode = PointerMode.MEASURE
        setPointerMode(PointerMode.MEASURE)
      },
    ],
    [
      "o",
      (): void => {
        renderer.settings.OUTLINE_MODE = !renderer.settings.OUTLINE_MODE
        setOutlineMode(renderer.settings.OUTLINE_MODE)
      },
    ],
    [
      "p",
      (): void => {
        renderer.settings.SKELETON_MODE = !renderer.settings.SKELETON_MODE
        setSkeletonMode(renderer.settings.SKELETON_MODE)
      },
    ],
    // ['g', gridSettingsModalHandlers.open],
    // ['e', engineSettingsModalHandlers.open],
    [
      "f",
      (): void => {
        renderer.engine.then(async (engine) => {
          engine.zoomFit("main")
        })
      },
    ],
  ])

  const contextItems = [
    {
      title: "Clear Measurements",
      key: "1",
      icon: <IconTrashX stroke={1.5} size={18} style={{ color: theme.colors.red[7] }} />,
      onClick: async (): Promise<void> => {
        const engine = await renderer.engine
        engine.clearMeasurements("main")
      },
    },
  ]

  React.useEffect(() => {
    renderer.engine.then((engine) => engine.setMeasurementSettings({ units }))
  }, [])

  return (
    <>
      <Card
        mod={["transparent"]}
        withBorder
        style={{
          width: "unset",
          height: "unset",
          position: "absolute",
          top: 10,
          right: 10,
          pointerEvents: "all",
        }}
        padding={4}
      >
        <Group gap="5">
          <ActionIcon.Group>
            <Tooltip openDelay={1000} withArrow label="Move">
              <ActionIcon
                size="lg"
                radius="sm"
                variant={pointerMode == PointerMode.MOVE ? "outline" : "default"}
                onClick={() => {
                  renderer.pointerSettings.mode = PointerMode.MOVE
                  setPointerMode(PointerMode.MOVE)
                }}
              >
                <IconArrowsMove size={18} />
              </ActionIcon>
            </Tooltip>
            <Tooltip openDelay={1000} withArrow label="Select">
              <ActionIcon
                size="lg"
                radius="sm"
                variant={pointerMode == PointerMode.SELECT ? "outline" : "default"}
                onClick={() => {
                  renderer.pointerSettings.mode = PointerMode.SELECT
                  setPointerMode(PointerMode.SELECT)
                }}
              >
                <IconClick size={18} />
              </ActionIcon>
            </Tooltip>
            <Tooltip openDelay={1000} withArrow label="Measure">
              <ActionIcon
                size="lg"
                radius="sm"
                variant={pointerMode == PointerMode.MEASURE ? "outline" : "default"}
                onClick={(): void => {
                  renderer.pointerSettings.mode = PointerMode.MEASURE
                  setPointerMode(PointerMode.MEASURE)
                }}
                onContextMenu={showContextMenu(contextItems)}
              >
                <IconRulerMeasure size={18} />
              </ActionIcon>
            </Tooltip>
          </ActionIcon.Group>
          <ActionIcon.Group>
            <Tooltip openDelay={1000} withArrow label="Zoom Fit">
              <ActionIcon
                size="lg"
                radius="sm"
                variant="default"
                onClick={async (): Promise<void> => {
                  const engine = await renderer.engine
                  engine.zoomFit("main")
                }}
              >
                <IconZoomReset size={18} />
              </ActionIcon>
            </Tooltip>
            <Popover withArrow position="bottom" radius="md">
              <Popover.Target>
                <Tooltip openDelay={1000} withArrow label="Snap Settings">
                  <ActionIcon size="lg" radius="sm" variant="default">
                    <IconPointerPin size={18} />
                  </ActionIcon>
                </Tooltip>
              </Popover.Target>
              <Popover.Dropdown
                style={{
                  padding: "4px",
                }}
              >
                <SnapSettings />
              </Popover.Dropdown>
            </Popover>
            <Tooltip openDelay={1000} withArrow label="Outline Mode">
              <ActionIcon
                size="lg"
                radius="sm"
                variant="default"
                onClick={async (): Promise<void> => {
                  renderer.settings.OUTLINE_MODE = !outlineMode
                  setOutlineMode(!outlineMode)
                }}
              >
                {outlineMode ? <IconCube3dSphere size={18} /> : <IconCube size={18} />}
              </ActionIcon>
            </Tooltip>
            <Tooltip openDelay={1000} withArrow label="Skeleton Mode">
              <ActionIcon
                size="lg"
                radius="sm"
                variant="default"
                onClick={async (): Promise<void> => {
                  renderer.settings.SKELETON_MODE = !skeletonMode
                  setSkeletonMode(!skeletonMode)
                }}
              >
                {skeletonMode ? <IconBone size={18} /> : <IconBoneOff size={18} />}
              </ActionIcon>
            </Tooltip>
            <Tooltip openDelay={1000} withArrow label="Grid Settings">
              <ActionIcon size="lg" radius="sm" variant="default" onClick={gridSettingsModalHandlers.open}>
                <IconGrid4x4 size={18} />
              </ActionIcon>
            </Tooltip>
            <Tooltip openDelay={1000} withArrow label="Engine Settings">
              <ActionIcon size="lg" radius="sm" variant="default" onClick={engineSettingsModalHandlers.open}>
                <IconEngine size={18} />
              </ActionIcon>
            </Tooltip>
          </ActionIcon.Group>
          <Tooltip openDelay={1000} withArrow label="Settings">
            <ActionIcon size="lg" radius="sm" variant="default" onClick={open}>
              <IconAdjustments size={18} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Card>
      <Modal title="Settings" keepMounted opened={settingsModalOpen} onClose={close}>
        <GeneralSettings />
      </Modal>
      <Modal title="Grid Settings" keepMounted opened={gridSettingsModal} onClose={gridSettingsModalHandlers.close}>
        <GridSettings />
      </Modal>
      <Modal title="Engine Settings" keepMounted opened={engineSettingsModal} onClose={engineSettingsModalHandlers.close}>
        <EngineSettings />
      </Modal>
      <Modal title="Snap Settings" keepMounted opened={snapSettingsModal} onClose={snapSettingsModalHandlers.close}>
        <SnapSettings />
      </Modal>
    </>
  )
}
