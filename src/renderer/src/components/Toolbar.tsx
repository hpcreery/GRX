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
  IconCube3dSphereOff,
  IconCube
} from '@tabler/icons-react'
import chroma from 'chroma-js'
import { Modal, ActionIcon, Text, Switch, Divider, Card, Group, Flex, useMantineTheme, useMantineColorScheme, ColorPicker, Tooltip, Radio } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'

interface ToolbarProps {
  renderEngine: RenderEngine
}

export default function Toolbar({ renderEngine }: ToolbarProps): JSX.Element | null {
  const [settingsModalOpen, { open, close }] = useDisclosure(false)
  const [outlineMode, setOutlineMode] = React.useState<boolean>(renderEngine.settings.OUTLINE_MODE)
  const { transparency, setTransparency, primaryColor, setPrimaryColor, units, setUnits } = React.useContext(ConfigEditorProvider)
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
          <Tooltip openDelay={500} withArrow label="Coming Soon!">
            <ActionIcon size='lg' disabled variant="default" onClick={(): void => { }}>
              <IconArrowsMove size={18} />
            </ActionIcon>
          </Tooltip>
          <Tooltip openDelay={500} withArrow label="Coming Soon!">
            <ActionIcon size='lg' disabled variant="default" onClick={(): void => { }}>
              <IconRulerMeasure size={18} />
            </ActionIcon>
          </Tooltip>
          <Tooltip openDelay={500} withArrow label="Outline Mode">
            <ActionIcon size='lg' variant="default" onClick={async (): Promise<void> => {
              renderEngine.settings.OUTLINE_MODE = !outlineMode
              setOutlineMode(!outlineMode)
            }}>
              {outlineMode ? <IconCube3dSphere size={18} /> : <IconCube size={18} />}
            </ActionIcon>
          </Tooltip>
          <Tooltip openDelay={500} withArrow label="Settings">
          <ActionIcon size='lg' variant="default" onClick={open}>
            <IconAdjustments size={18} />
          </ActionIcon>
          </Tooltip>
        </Group>
      </Card>
      <Modal title="Settings" opened={settingsModalOpen} onClose={close}>
      <Divider my="sm" />
        <Flex align="center" style={{ width: '100%' }} justify="space-between">
          <Text>Units</Text>
            <Group mt="xs">
              <Radio value="mm" label="mm" checked={units == 'mm'} onChange={(): void => setUnits('mm')}/>
              <Radio value="in" label="inch" checked={units == 'inch'} onChange={(): void => setUnits('inch')}/>
              <Radio value="cm" label="cm" checked={units == 'cm'} onChange={(): void => setUnits('cm')}/>
              <Radio value="mil" label="mil" checked={units == 'mil'} onChange={(): void => setUnits('mil')}/>
            </Group>
        </Flex>
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
