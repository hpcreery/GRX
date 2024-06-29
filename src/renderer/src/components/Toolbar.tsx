import React from 'react'
import { RenderEngine } from '@src/renderer'
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
  IconEngine
} from '@tabler/icons-react'
// import chroma from 'chroma-js'
import {
  Modal,
  ActionIcon,
  Card,
  Group,
  Tooltip,
  useMantineTheme,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import GeneralSettings from './toolbar/GeneralSettings'
import GridSettings from './toolbar/GridSettings'
import EngineSettings from './toolbar/EngineSettings'
import type { PointerSettings } from '@src/renderer'
import { useContextMenu } from 'mantine-contextmenu'
import { ConfigEditorProvider } from '@src/contexts/ConfigEditor';
import { actions } from '@src/contexts/Spotlight'

interface ToolbarProps {
  renderEngine: RenderEngine
}

export default function Toolbar({ renderEngine }: ToolbarProps): JSX.Element | null {
  const { units } = React.useContext(ConfigEditorProvider)
  const [settingsModalOpen, { open, close }] = useDisclosure(false)
  const [gridSettingsModal, gridSettingsModalHandlers] = useDisclosure(false)
  const [engineSettingsModal, engineSettingsModalHandlers] = useDisclosure(false)
  const [outlineMode, setOutlineMode] = React.useState<boolean>(renderEngine.settings.OUTLINE_MODE)
  // const [gridMode, setGridMode] = React.useState<'dots' | 'lines'>(renderEngine.grid.type)
  const [pointerMode, setPointerMode] = React.useState<PointerSettings["mode"]>(renderEngine.pointerSettings.mode)
  const { showContextMenu } = useContextMenu()
  const theme = useMantineTheme()

  React.useEffect(() => {
    actions.push({
      id: 'outline mode off',
      label: 'Disable Outline Mode',
      description: 'Default fill mode',
      onClick: () => {
        renderEngine.settings.OUTLINE_MODE = false
        setOutlineMode(false)
      },
      leftSection: <IconCube />,
    })
    actions.push({
      id: 'outline mode on',
      label: 'Enable Outline Mode',
      description: 'Show outline of all features',
      onClick: () => {
        renderEngine.settings.OUTLINE_MODE = true
        setOutlineMode(true)
      },
      leftSection: <IconCube3dSphere />,
    })
    actions.push({
      id: 'open settings modal',
      label: 'Open Settings',
      description: 'Show general settings',
      onClick: open,
      leftSection: <IconAdjustments />,
    })
    actions.push({
      id: 'open grid settings modal',
      label: 'Open Grid Settings',
      description: 'Show grid settings',
      onClick: gridSettingsModalHandlers.open,
      leftSection: <IconGrid4x4 />,
    })
    actions.push({
      id: 'open engine settings modal',
      label: 'Open Engine Settings',
      description: 'Show engine settings',
      onClick: engineSettingsModalHandlers.open,
      leftSection: <IconEngine />,
    })
    actions.push({
      id: 'clear measurements',
      label: 'Clear Measurements',
      description: 'Delete and remove all measurements',
      onClick: async (): Promise<void> => {
        const backend = await renderEngine.backend
        backend.clearMeasurements()
      },
      leftSection: <IconTrashX />,
    })
  }, [])

  const contextItems = [
    {
      title: 'Clear Measurements',
      key: '1',
      icon: <IconTrashX stroke={1.5} size={18} style={{ color: theme.colors.red[7] }} />,
      onClick: async (): Promise<void> => {
        const backend = await renderEngine.backend
        backend.clearMeasurements()
      }
    },
  ]

  React.useEffect(() => {
    renderEngine.backend.then(backend => backend.setMeasurementUnits(units))
  }, [])

  return (
    <>
      <Card
        mod={['transparent']}
        withBorder
        style={{
          width: 'unset',
          height: 'unset',
          position: 'absolute',
          top: 10,
          right: 10,
          pointerEvents: 'all'
        }}
        padding={4}
      >
        <Group gap='5'>
          <ActionIcon.Group>
            <Tooltip openDelay={500} withArrow label="Move">
              <ActionIcon size='lg' radius="sm" variant={pointerMode == 'move' ? "outline" : 'default'} onClick={() => {
                renderEngine.pointerSettings.mode = 'move'
                setPointerMode('move')
              }}>
                <IconArrowsMove size={18} />
              </ActionIcon>
            </Tooltip>
            <Tooltip openDelay={500} withArrow label="Select">
              <ActionIcon size='lg' radius="sm" variant={pointerMode == 'select' ? "outline" : 'default'} onClick={() => {
                renderEngine.pointerSettings.mode = 'select'
                setPointerMode('select')
              }}>
                <IconClick size={18} />
              </ActionIcon>
            </Tooltip>
            <Tooltip openDelay={500} withArrow label="Measure">
              <ActionIcon size='lg' radius="sm" variant={pointerMode == 'measure' ? "outline" : 'default'} onClick={(): void => {
                renderEngine.pointerSettings.mode = 'measure'
                setPointerMode('measure')
              }}
                onContextMenu={showContextMenu(contextItems)}>
                <IconRulerMeasure size={18} />
              </ActionIcon>
            </Tooltip>
          </ActionIcon.Group>
          <ActionIcon.Group>
            <Tooltip openDelay={500} withArrow label="Zoom Fit">
              <ActionIcon size='lg' radius="sm" variant="default" onClick={async (): Promise<void> => {
                renderEngine.zoomFit()
              }}>
                <IconZoomReset size={18} />
              </ActionIcon>
            </Tooltip>
            <Tooltip openDelay={500} withArrow label="Outline Mode">
              <ActionIcon size='lg' radius="sm" variant="default" onClick={async (): Promise<void> => {
                renderEngine.settings.OUTLINE_MODE = !outlineMode
                setOutlineMode(!outlineMode)
              }}>
                {outlineMode ? <IconCube3dSphere size={18} /> : <IconCube size={18} />}
              </ActionIcon>
            </Tooltip>
            <Tooltip openDelay={500} withArrow label="Grid Settings">
              <ActionIcon size='lg' radius="sm" variant="default" onClick={gridSettingsModalHandlers.open}>
                <IconGrid4x4 size={18} />
              </ActionIcon>
            </Tooltip>
            <Tooltip openDelay={500} withArrow label="Engine Fill Settings">
              <ActionIcon size='lg' radius="sm" variant="default" onClick={engineSettingsModalHandlers.open}>
                <IconEngine size={18} />
              </ActionIcon>
            </Tooltip>
          </ActionIcon.Group>
          <Tooltip openDelay={500} withArrow label="Settings">
            <ActionIcon size='lg' radius="sm" variant="default" onClick={open}>
              <IconAdjustments size={18} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Card>
      <Modal title="Settings" keepMounted opened={settingsModalOpen} onClose={close}>
        <GeneralSettings renderEngine={renderEngine} />
      </Modal>
      <Modal title="Grid Settings" keepMounted opened={gridSettingsModal} onClose={gridSettingsModalHandlers.close}>
        <GridSettings renderEngine={renderEngine} />
      </Modal>
      <Modal title="Engine Settings" keepMounted opened={engineSettingsModal} onClose={engineSettingsModalHandlers.close}>
        <EngineSettings renderEngine={renderEngine} />
      </Modal>
    </>
  )
}
