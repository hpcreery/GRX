import React from 'react'
import { RenderEngine } from '@src/renderer'
import { ConfigEditorProvider } from '../contexts/ConfigEditor'
import {
  IconArrowsMove,
  IconRulerMeasure,
  IconZoomIn,
  IconZoomOut,
  IconHome,
  IconAdjustments,
  IconCube3dSphere,
  IconCube3dSphereOff
} from '@tabler/icons-react'
import chroma from 'chroma-js'
import { Modal, ActionIcon, Text, Switch, Divider, Card, Group, Flex, useMantineTheme, useMantineColorScheme, ColorPicker, Tooltip } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'

interface ToolbarProps {
  renderEngine: RenderEngine
}

export default function Toolbar({ renderEngine }: ToolbarProps): JSX.Element | null {
  const [settingsModalOpen, { open, close }] = useDisclosure(false)
  const [outlineMode, setOutlineMode] = React.useState<boolean>(renderEngine.settings.OUTLINE_MODE)
  const { transparency, setTransparency, primaryColor, setPrimaryColor } = React.useContext(ConfigEditorProvider)
  const theme = useMantineTheme()
  const colors = useMantineColorScheme()


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
        padding={3}
      >
        <Group gap='xs'>
          <Tooltip label="Coming Soon!">
            <ActionIcon size='lg' disabled variant="default" onClick={(): void => { }}>
              <IconArrowsMove size={18} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Coming Soon!">
            <ActionIcon size='lg' disabled variant="default" onClick={(): void => { }}>
              <IconRulerMeasure size={18} />
            </ActionIcon>
          </Tooltip>
          <ActionIcon size='lg' variant="default" onClick={async (): Promise<void> => {
            renderEngine.settings.OUTLINE_MODE = !outlineMode
            setOutlineMode(!outlineMode)
          }}>
            {outlineMode ? <IconCube3dSphere size={18} /> : <IconCube3dSphereOff size={18} />}
          </ActionIcon>
          <ActionIcon size='lg' variant="default" onClick={open}>
            <IconAdjustments size={18} />
          </ActionIcon>
        </Group>
      </Card>
      <Modal title="Settings" opened={settingsModalOpen} onClose={close}>
        <Divider my="sm" />
        <Flex align="center" style={{ width: '100%' }} justify="space-between">
          <Text>Dark Mode</Text>
          <Switch
            defaultChecked={colors.colorScheme === 'dark'}
            onChange={(event): void => {
              if (event.currentTarget.checked) {
                colors.setColorScheme('dark')
                renderEngine.settings.BACKGROUND_COLOR = chroma(theme.colors.dark[8]).alpha(0).gl()
              } else {
                colors.setColorScheme('light')
                renderEngine.settings.BACKGROUND_COLOR = chroma(theme.colors.dark[8]).alpha(0).gl()
              }
            }}
          />
        </Flex>
        <Divider my="sm" />
        <Flex align="center" style={{ width: '100%' }} justify="space-between">
          <Text>Color</Text>
          <ColorPicker
            withPicker={false}
            onChange={(color): void => {
              const colorName = Object.keys(theme.colors).find(key => theme.colors[key][9] === color)
              theme.primaryColor = colorName || 'teal'
              setPrimaryColor(colorName || 'teal')
            }
            }
            swatches={[...Object.values(theme.colors).map(x => x[9])]} />
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
