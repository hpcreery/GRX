import React from 'react'
import VirtualGerberApplication from '../renderer/virtual'
import { ConfigEditorProvider } from '../contexts/ConfigEditor'
import {
  IconArrowsMove,
  IconRulerMeasure,
  IconZoomIn,
  IconZoomOut,
  IconHome,
  IconAdjustments,
  IconDiamond,
  IconDiamondFilled
} from '@tabler/icons-react'
import { Modal, ActionIcon, Text, Switch, Divider, Card, Group, Flex } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'

interface ToolbarProps {
  gerberApp: VirtualGerberApplication
}

export default function Toolbar({ gerberApp }: ToolbarProps): JSX.Element | null {
  const [isOutlineMode, setIsOutlineMode] = React.useState(false)
  const [settingsModalOpen, { open, close }] = useDisclosure(false)
  const { themeMode, setThemeMode, transparency, setTransparency } =
    React.useContext(ConfigEditorProvider)


  const setOutlineMode = (mode: boolean): void => {
    gerberApp.renderer.then(async (renderer) => {
      renderer.setAllOutlineMode(mode)
    })
    setIsOutlineMode(mode)
  }

  return (
    <>
      <Card
        withBorder
        style={{
          width: 'unset',
          height: 'unset',
          position: 'absolute',
          top: 10,
          right: 10,
          pointerEvents: 'all'
        }}
        padding={3}
        className={'transparency'}
      >
        <Group spacing={1}>
          <ActionIcon size="lg" onClick={(): void => setOutlineMode(!isOutlineMode)}>
            {isOutlineMode ? <IconDiamond size={18} /> : <IconDiamondFilled size={18} />}
          </ActionIcon>

          <Divider my="xs" orientation="vertical" />
          <ActionIcon size="lg" onClick={(): void => { }}>
            <IconArrowsMove size={18} />
          </ActionIcon>
          <ActionIcon size="lg" onClick={(): void => { }}>
            <IconRulerMeasure size={18} />
          </ActionIcon>
          <Divider my="xs" orientation="vertical" />
          <ActionIcon
            size="lg"
            onClick={(): void => {
              gerberApp.zoom(-550 / gerberApp.virtualViewport.scale.x)
            }}
          >
            <IconZoomIn size={18} />
          </ActionIcon>
          <ActionIcon
            size="lg"
            onClick={async (): Promise<void> => {
              gerberApp.zoom(1000 / gerberApp.virtualViewport.scale.x)
            }}
          >
            <IconZoomOut size={18} />
          </ActionIcon>
          <ActionIcon
            size="lg"
            onClick={(): void => {
              gerberApp.zoomHome()
              gerberApp.virtualViewport.decelerate()
            }}
          >
            <IconHome size={18} />
          </ActionIcon>
          <Divider my="xs" orientation="vertical" />
          <ActionIcon size="lg" onClick={open}>
            <IconAdjustments size={18} />
          </ActionIcon>
        </Group>
      </Card>
      <Modal title="Settings" opened={settingsModalOpen} onClose={close}>
        <Divider my="sm" />
        <Flex align="center" style={{ width: '100%' }} justify="space-between">
          <Text>Dark Mode</Text>
          <Switch
            defaultChecked={themeMode === 'dark'}
            onChange={(event): void => {
              if (event.currentTarget.checked) {
                setThemeMode('dark')
              } else {
                setThemeMode('light')
              }
            }}
          />
        </Flex>
        <Divider my="sm" />
        <Flex align="center" style={{ width: '100%' }} justify="space-between">
          <Text>Transparency</Text>
          <Switch
            defaultChecked={transparency}
            onChange={(event): void => {
              setTransparency(event.currentTarget.checked)
            }}
          />
        </Flex>
      </Modal>
    </>
  )
}
