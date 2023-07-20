import React from 'react'
import { PointerEvent } from '../renderer/virtual'
import { Card, Group, Text, Tooltip } from '@mantine/core'
import { useGerberAppContext } from '../contexts/GerberApp'

interface MousePositionProps {
}

export default function MousePosition(props: MousePositionProps): JSX.Element | null {
  const gerberApp = useGerberAppContext()

  const [x, setX] = React.useState<number>(0)
  const [y, setY] = React.useState<number>(0)

  React.useEffect(() => {
    const handleMouseMove = (e: PointerEvent): void => {
      setX(e.detail.x)
      setY(e.detail.y)
    }
    gerberApp.pointer.addEventListener('pointermove', handleMouseMove as EventListener)
    gerberApp.pointer.addEventListener('pointerdown', handleMouseMove as EventListener)
    return () => {
      gerberApp.pointer.removeEventListener('pointermove', handleMouseMove as EventListener)
      gerberApp.pointer.removeEventListener('pointerdown', handleMouseMove as EventListener)
    }
  }, [])

  return (
    <Tooltip label="Units: Mils" position="left" withArrow>
      <Card
        withBorder
        style={{
          position: 'absolute',
          bottom: 10,
          right: 60,
          pointerEvents: 'all',
          width: 275,
          height: 40
        }}
        className={'transparency'}
        padding={6.5}
      >
        <Group position="center" grow ml="xs" mr="xs">
          <Group>
            <Text c="dimmed">X: </Text>
            {x.toFixed(2)}
          </Group>
          <Group>
            <Text c="dimmed">Y: </Text>
            {y.toFixed(2)}
          </Group>
        </Group>
      </Card>
    </Tooltip>
  )
}
