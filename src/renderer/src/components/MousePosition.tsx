import React from "react"
import { PointerEvent } from "@src/renderer"
import { PointerEvents } from "@src/renderer"
import { Card, Group, Text, Tooltip } from "@mantine/core"
import { EditorConfigProvider } from "@src/contexts/EditorContext"
import { getUnitsConversion } from "@src/renderer/engine/utils"

interface MousePositionProps {}

export default function MousePosition(_props: MousePositionProps): JSX.Element | null {
  const { units, renderEngine } = React.useContext(EditorConfigProvider)

  const [x, setX] = React.useState<number>(0)
  const [y, setY] = React.useState<number>(0)

  React.useEffect(() => {
    const handleMouseMove = (e: PointerEvent): void => {
      // DEFAULT UNITS ARE MM
      setX(e.detail.x)
      setY(e.detail.y)
    }
    renderEngine.pointer.addEventListener(PointerEvents.POINTER_HOVER, handleMouseMove as EventListener)
    renderEngine.pointer.addEventListener(PointerEvents.POINTER_DOWN, handleMouseMove as EventListener)
    return (): void => {
      renderEngine.pointer.removeEventListener(PointerEvents.POINTER_HOVER, handleMouseMove as EventListener)
      renderEngine.pointer.removeEventListener(PointerEvents.POINTER_DOWN, handleMouseMove as EventListener)
    }
  }, [])

  return (
    <Tooltip label={`Units: ${units}`} position="left" withArrow>
      <Card
        mod={["transparent"]}
        withBorder
        style={{
          position: "absolute",
          bottom: 10,
          right: 60,
          pointerEvents: "all",
          width: 275,
          height: 40,
        }}
        padding={6.5}
      >
        <Group grow ml="xs" mr="xs" wrap="nowrap">
          <Group wrap="nowrap">
            <Text c="dimmed">X: </Text>
            {(x * getUnitsConversion(units)).toFixed(3)}
            {units}
          </Group>
          <Group wrap="nowrap">
            <Text c="dimmed">Y: </Text>
            {(y * getUnitsConversion(units)).toFixed(3)}
            {units}
          </Group>
        </Group>
      </Card>
    </Tooltip>
  )
}
