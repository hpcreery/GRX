import { useEffect } from 'react'
import { RenderEngine } from '@src/renderer'
import {
  Text,
  Flex,
  Select,
  Switch,
  Divider
} from '@mantine/core'
import {
  IconZoom,
  IconZoomScan
} from '@tabler/icons-react'
import { ColorBlend, ColorBlends } from '@src/renderer/engine'
import { useLocalStorage } from '@mantine/hooks'
import { actions } from '@src/contexts/Spotlight'

interface EngineSettingsProps {
  renderEngine: RenderEngine
}

export default function EngineSettings({ renderEngine }: EngineSettingsProps): JSX.Element | null {
  const [colorBlend, setColorBlend] = useLocalStorage<ColorBlends>({
    key: 'engine:COLOR_BLEND',
    defaultValue: renderEngine.settings.COLOR_BLEND
  })
  const [zoomToCursor, setZoomToCursor] = useLocalStorage<boolean>({
    key: 'engine:ZOOM_TO_CURSOR',
    defaultValue: renderEngine.settings.ZOOM_TO_CURSOR
  })

  useEffect(() => {
    renderEngine.settings.COLOR_BLEND = colorBlend
    renderEngine.settings.ZOOM_TO_CURSOR = zoomToCursor
  }, [colorBlend, zoomToCursor])

  useEffect(() => {
    actions.push({
      id: 'zoom to cursor off',
      label: 'Enable Zoom to Center',
      description: 'Disable zoom to cursor',
      onClick: () => setZoomToCursor(false),
      leftSection: <IconZoomScan />,
    })
    actions.push({
      id: 'zoom to cursor on',
      label: 'Enable Zoom to Cursor',
      description: 'Disable zoom to center',
      onClick: () => setZoomToCursor(true),
      leftSection: <IconZoom />,
    })
  }, [])

  return (
    <>
      <Flex align="center" style={{ width: '100%' }} justify="space-between">
        <Text>Color Blend</Text>
        <Select clearable={false} data={Object.values(ColorBlend)} value={colorBlend} onChange={val => val && setColorBlend(val as ColorBlends)} />
      </Flex>
      <Divider my="sm" />
      <Flex align="center" style={{ width: '100%' }} justify="space-between">
        <Text>Zoom To Cursor</Text>
        <Switch
          checked={zoomToCursor}
          onChange={(event): void => setZoomToCursor(event.currentTarget.checked)}
        />
      </Flex>
    </>
  )
}
