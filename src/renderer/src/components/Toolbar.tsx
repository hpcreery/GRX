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
  IconZoomReset
} from '@tabler/icons-react'
// import chroma from 'chroma-js'
import {
  Modal,
  ActionIcon,
  Card,
  Group,
  Tooltip,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import GeneralSettings from './toolbar/GeneralSettings'
import GridSettings from './toolbar/GridSettings'
import type { PointerSettings } from '@src/renderer'

interface ToolbarProps {
  renderEngine: RenderEngine
}

export default function Toolbar({ renderEngine }: ToolbarProps): JSX.Element | null {
  const [settingsModalOpen, { open, close }] = useDisclosure(false)
  const [gridSettingsModal, gridSettingsModalHandlers] = useDisclosure(false)
  const [outlineMode, setOutlineMode] = React.useState<boolean>(renderEngine.settings.OUTLINE_MODE)
  // const [gridMode, setGridMode] = React.useState<'dots' | 'lines'>(renderEngine.grid.type)
  const [pointerMode, setPointerMode] = React.useState<PointerSettings["mode"]>(renderEngine.pointerSettings.mode)


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
        <Group gap='xs'>
          <ActionIcon.Group>
            <Tooltip openDelay={500} withArrow label="Move">
              <ActionIcon size='lg' radius="sm" variant={pointerMode == 'move' ? "outline" : 'default'} onClick={() => {
                renderEngine.pointerSettings.mode = 'move'
                setPointerMode('move')
              }}>
                <IconArrowsMove size={18}/>
              </ActionIcon>
            </Tooltip>
            <Tooltip openDelay={500} withArrow label="Query">
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
               }}>
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
          </ActionIcon.Group>
          <Tooltip openDelay={500} withArrow label="Settings">
            <ActionIcon size='lg' radius="sm" variant="default" onClick={open}>
              <IconAdjustments size={18} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Card>
      <Modal title="Settings" opened={settingsModalOpen} onClose={close}>
        <GeneralSettings renderEngine={renderEngine} />
      </Modal>
      <Modal title="Grid Settings" opened={gridSettingsModal} onClose={gridSettingsModalHandlers.close}>
        <GridSettings renderEngine={renderEngine} />
      </Modal>
    </>
  )
}
