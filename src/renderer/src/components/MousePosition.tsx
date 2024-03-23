import React from 'react'
import { PointerEvent } from '@src/renderer'
import { PointerEvents, RenderEngine } from '@src/renderer'
import { Card, Group, Text, Tooltip } from '@mantine/core'

interface MousePositionProps {
  renderEngine: RenderEngine
}

export default function MousePosition(props: MousePositionProps): JSX.Element | null {
  const { renderEngine } = props

  const [x, setX] = React.useState<number>(0)
  const [y, setY] = React.useState<number>(0)

  React.useEffect(() => {
    const handleMouseMove = (e: PointerEvent): void => {
      // DEFAULT UNITS ARE MM
      setX(e.detail.x)
      setY(e.detail.y)
    }
    renderEngine.pointer.addEventListener(PointerEvents.POINTER_HOVER, handleMouseMove as EventListener)
    return () => {
      renderEngine.pointer.removeEventListener(PointerEvents.POINTER_HOVER, handleMouseMove as EventListener)
    }
  }, [])

  return (
    <Tooltip label="Units: MM" position="left" withArrow>
      <Card
        mod={['transparent']}
        withBorder
        style={{
          position: 'absolute',
          bottom: 10,
          right: 60,
          pointerEvents: 'all',
          width: 275,
          height: 40
        }}
        padding={6.5}
      >
        <Group grow ml="xs" mr="xs">
          <Group>
            <Text c="dimmed">X: </Text>
            {x.toFixed(3)}mm
          </Group>
          <Group>
            <Text c="dimmed">Y: </Text>
            {y.toFixed(3)}mm
          </Group>
        </Group>
      </Card>
    </Tooltip>
  )
}
