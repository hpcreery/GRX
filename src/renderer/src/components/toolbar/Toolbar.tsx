import React, { JSX } from "react"
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
  IconBadge3d,
  IconBadge3dFilled,
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
import ThreeDSettings from './3DSettings'

interface ToolbarProps {}

export default function Toolbar(_props: ToolbarProps): JSX.Element | null {
  const { units, renderer } = React.useContext(EditorConfigProvider)
  const [settingsModalOpen, { open, close }] = useDisclosure(false)
  const [gridSettingsModal, gridSettingsModalHandlers] = useDisclosure(false)
  const [engineSettingsModal, engineSettingsModalHandlers] = useDisclosure(false)
  const [snapSettingsModal, snapSettingsModalHandlers] = useDisclosure(false)
  const [threeDSettingsModal, threeDSettingsModalHandlers] = useDisclosure(false)
  const [outlineMode, setOutlineMode] = React.useState<boolean>(false)
  const [skeletonMode, setSkeletonMode] = React.useState<boolean>(false)
  // const [gridMode, setGridMode] = React.useState<'dots' | 'lines'>(renderer.grid.type)
  const [pointerMode, setPointerMode] = React.useState<PointerSettings["mode"]>(renderer.pointerSettings.mode)
  const { showContextMenu } = useContextMenu()
  const theme = useMantineTheme()

  async function getModes(): Promise<void> {
    const settings = await renderer.engine.interface.read_engine_settings()
    setOutlineMode(settings.OUTLINE_MODE)
    setSkeletonMode(settings.SKELETON_MODE)
  }

  React.useEffect(() => {
    getModes()
  }, [])

  React.useEffect(() => {
    menuItems.push({
      key: "clear measurements",
      title: "Clear Measurements",
      icon: <IconTrashX stroke={1.5} size={18} color={theme.colors.red[7]} />,
      onClick: async (): Promise<void> => {
        renderer.engine.interface.clear_view_measurements("main")
      },
    })
    actions.push({
      id: "outline mode off",
      label: "Disable Outline Mode",
      description: "Default fill mode",
      onClick: () => {
        renderer.engine.interface.set_engine_settings({ OUTLINE_MODE: false })
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
        renderer.engine.interface.set_engine_settings({ OUTLINE_MODE: true })
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
        renderer.engine.interface.set_engine_settings({ SKELETON_MODE: false })
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
        renderer.engine.interface.set_engine_settings({ SKELETON_MODE: true })
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
        renderer.engine.interface.clear_view_measurements("main")
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
      async (): Promise<void> => {
        const currentSettings = await renderer.engine.interface.read_engine_settings()
        renderer.engine.interface.set_engine_settings({ OUTLINE_MODE: !currentSettings.OUTLINE_MODE })
        setOutlineMode(!currentSettings.OUTLINE_MODE)
      },
    ],
    [
      "p",
      async (): Promise<void> => {
        const currentSettings = await renderer.engine.interface.read_engine_settings()
        renderer.engine.interface.set_engine_settings({ SKELETON_MODE: !currentSettings.SKELETON_MODE })
        setSkeletonMode(!currentSettings.SKELETON_MODE)
      },
    ],
    // ['g', gridSettingsModalHandlers.open],
    // ['e', engineSettingsModalHandlers.open],
    [
      "f",
      (): void => {
        renderer.engine.interface.update_view_zoom_fit_artwork("main")
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
        engine.interface.clear_view_measurements("main")
      },
    },
  ]

  React.useEffect(() => {
    renderer.engine.interface.update_measurement_settings({ units })
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
            {/* ZOOM HOME */}
            <Tooltip openDelay={1000} withArrow label="Zoom Fit">
              <ActionIcon
                size="lg"
                radius="sm"
                variant="default"
                onClick={async (): Promise<void> => {
                  const engine = await renderer.engine
                  engine.interface.update_view_zoom_fit_artwork("main")
                }}
              >
                <IconZoomReset size={18} />
              </ActionIcon>
            </Tooltip>
            {/* SNAP */}
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
            {/* 3D */}
            <Popover withArrow position="bottom" radius="md">
              <Popover.Target>
                <Tooltip openDelay={1000} withArrow label="3D Settings">
                  <ActionIcon size="lg" radius="sm" variant="default">
                    <IconBadge3d size={18} />
                  </ActionIcon>
                </Tooltip>
              </Popover.Target>
              <Popover.Dropdown
                style={{
                  padding: "4px",
                }}
              >
                <ThreeDSettings />
              </Popover.Dropdown>
            </Popover>
            {/* OUTLINE MODE */}
            <Tooltip openDelay={1000} withArrow label="Outline Mode">
              <ActionIcon
                size="lg"
                radius="sm"
                variant="default"
                onClick={async (): Promise<void> => {
                  renderer.engine.interface.set_engine_settings({ OUTLINE_MODE: !outlineMode })
                  setOutlineMode(!outlineMode)
                }}
              >
                {outlineMode ? <IconCube3dSphere size={18} /> : <IconCube size={18} />}
              </ActionIcon>
            </Tooltip>
            {/* SKELETON MODE */}
            <Tooltip openDelay={1000} withArrow label="Skeleton Mode">
              <ActionIcon
                size="lg"
                radius="sm"
                variant="default"
                onClick={async (): Promise<void> => {
                  renderer.engine.interface.set_engine_settings({ SKELETON_MODE: !skeletonMode })
                  setSkeletonMode(!skeletonMode)
                }}
              >
                {skeletonMode ? <IconBone size={18} /> : <IconBoneOff size={18} />}
              </ActionIcon>
            </Tooltip>
            {/* GRID SETTINGS */}
            <Tooltip openDelay={1000} withArrow label="Grid Settings">
              <ActionIcon size="lg" radius="sm" variant="default" onClick={gridSettingsModalHandlers.open}>
                <IconGrid4x4 size={18} />
              </ActionIcon>
            </Tooltip>
            {/* ENGINE SETTINGS */}
            <Tooltip openDelay={1000} withArrow label="Engine Settings">
              <ActionIcon size="lg" radius="sm" variant="default" onClick={engineSettingsModalHandlers.open}>
                <IconEngine size={18} />
              </ActionIcon>
            </Tooltip>
          </ActionIcon.Group>
          {/* SETTINGS */}
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
      <Modal title="3D Settings" keepMounted opened={threeDSettingsModal} onClose={threeDSettingsModalHandlers.close}>
        <ThreeDSettings />
      </Modal>
    </>
  )
}
