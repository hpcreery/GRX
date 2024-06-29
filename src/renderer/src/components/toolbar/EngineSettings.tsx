import { useEffect, useState } from 'react'
import { RenderEngine } from '@src/renderer'
import {
  Text,
  Divider,
  Flex,
  Select
} from '@mantine/core'
import { ColorBlend, ColorBlends } from '@src/renderer/engine'

interface EngineSettingsProps {
  renderEngine: RenderEngine
}

export default function EngineSettings({ renderEngine }: EngineSettingsProps): JSX.Element | null {
  const [colorBlend, setColorBlend] = useState<string | null>(renderEngine.settings.COLOR_BLEND)

  useEffect(() => {
    renderEngine.settings.COLOR_BLEND = colorBlend as ColorBlends
    renderEngine.updateBlendCommand()
    renderEngine.render({ force: true })
    console.log('Color Blend:', renderEngine.settings.COLOR_BLEND)
  }, [colorBlend])

  return (
    <>
      <Flex align="center" style={{ width: '100%' }} justify="space-between">
        <Text>Color Blend</Text>
        <Select data={Object.values(ColorBlend)} value={colorBlend} onChange={setColorBlend} />
      </Flex>
      {/* <Divider my="sm" /> */}
    </>
  )
}
