import React, { useEffect } from "react"
import { EditorConfigProvider } from "../../contexts/EditorContext"
import chroma from "chroma-js"
import { Text, Switch, Divider, Group, Flex, ColorPicker, SegmentedControl, NumberInput, Button, Space } from "@mantine/core"
import { baseUnitsConversionFactor } from "@src/renderer/engine/utils"
import { vec4 } from "gl-matrix"
import { useLocalStorage } from "@mantine/hooks"
import { gridSettings } from "@src/renderer/engine/settings"

interface GridSettingsProps {}
const defaultGridSettings = JSON.parse(JSON.stringify(gridSettings))

export default function GridSettings(_props: GridSettingsProps): JSX.Element | null {
  const { units, renderer } = React.useContext(EditorConfigProvider)
  const [spacingX, setSpacingX] = useLocalStorage<number>({
    key: "engine:grid:spacing_x",
    defaultValue: renderer.grid.spacing_x,
  })
  const [spacingY, setSpacingY] = useLocalStorage<number>({
    key: "engine:grid:spacing_y",
    defaultValue: renderer.grid.spacing_y,
  })
  const [offsetX, setOffsetX] = useLocalStorage<number>({
    key: "engine:grid:offset_x",
    defaultValue: renderer.grid.offset_x,
  })
  const [offsetY, setOffsetY] = useLocalStorage<number>({
    key: "engine:grid:offset_y",
    defaultValue: renderer.grid.offset_y,
  })
  const [enabled, setEnabled] = useLocalStorage<boolean>({
    key: "engine:grid:enabled",
    defaultValue: renderer.grid.enabled,
  })
  const [type, setType] = useLocalStorage<"lines" | "dots">({
    key: "engine:grid:type",
    defaultValue: renderer.grid.type,
  })
  const [color, setColor] = useLocalStorage<vec4>({
    key: "engine:grid:color",
    defaultValue: renderer.grid.color,
  })

  useEffect(() => {
    renderer.grid.spacing_x = spacingX
    renderer.grid.spacing_y = spacingY
    renderer.grid.offset_x = offsetX
    renderer.grid.offset_y = offsetY
    renderer.grid.enabled = enabled
    renderer.grid.type = type
    renderer.grid.color = color
  }, [spacingX, spacingY, offsetX, offsetY, enabled, type, color])

  return (
    <>
      <Flex align="center" style={{ width: "100%" }} justify="space-between">
        <Text>Enabled</Text>
        <Switch checked={enabled} onChange={(event): void => setEnabled(event.currentTarget.checked)} />
      </Flex>
      <Divider my="sm" />
      <Flex align="center" style={{ width: "100%" }} justify="space-between">
        <Text>Type</Text>
        <SegmentedControl
          data={[
            { label: "Lines", value: "lines" },
            { label: "Dots", value: "dots" },
          ]}
          value={type}
          size="sm"
          radius="sm"
          onChange={(value): void => {
            setEnabled(true)
            setType(value as "lines" | "dots")
          }}
        />
      </Flex>
      <Divider my="sm" />
      <Flex align="center" style={{ width: "100%" }} justify="space-between">
        <Text>Spacing</Text>
        <Group
          style={{
            width: "300px",
          }}
          wrap="nowrap"
        >
          X:
          <NumberInput
            allowNegative={false}
            suffix={` ${units}`}
            value={Math.round((spacingX * baseUnitsConversionFactor(units) + Number.EPSILON) * 1000) / 1000}
            onChange={(value): void => setSpacingX(Number(value) / baseUnitsConversionFactor(units))}
          />
          Y:
          <NumberInput
            allowNegative={false}
            suffix={` ${units}`}
            value={Math.round((spacingY * baseUnitsConversionFactor(units) + Number.EPSILON) * 1000) / 1000}
            onChange={(value): void => setSpacingY(Number(value) / baseUnitsConversionFactor(units))}
          />
        </Group>
      </Flex>
      <Divider my="sm" />
      <Flex align="center" style={{ width: "100%" }} justify="space-between">
        <Text>Offset</Text>
        <Group
          style={{
            width: "300px",
          }}
          wrap="nowrap"
        >
          X:
          <NumberInput
            allowNegative={false}
            suffix={` ${units}`}
            value={Math.round((offsetX * baseUnitsConversionFactor(units) + Number.EPSILON) * 1000) / 1000}
            onChange={(value): void => setOffsetX(Number(value) / baseUnitsConversionFactor(units))}
          />
          Y:
          <NumberInput
            allowNegative={false}
            suffix={` ${units}`}
            value={Math.round((offsetY * baseUnitsConversionFactor(units) + Number.EPSILON) * 1000) / 1000}
            onChange={(value): void => setOffsetY(Number(value) / baseUnitsConversionFactor(units))}
          />
        </Group>
      </Flex>
      <Divider my="sm" />
      <Flex align="center" style={{ width: "100%" }} justify="space-between">
        <Text>Color</Text>
        <ColorPicker
          format="rgba"
          value={chroma.gl(color[0], color[1], color[2], color[3]).hex()}
          onChange={(val): void => setColor(chroma(val).gl())}
        />
      </Flex>
      <Space h="md" />
      <Flex align="center" style={{ width: "100%" }} justify="space-between">
        <Button
          fullWidth
          onClick={(): void => {
            setSpacingX(defaultGridSettings.spacing_x)
            setSpacingY(defaultGridSettings.spacing_y)
            setOffsetX(defaultGridSettings.offset_x)
            setOffsetY(defaultGridSettings.offset_y)
            setEnabled(defaultGridSettings.enabled)
            setType(defaultGridSettings.type)
            setColor(defaultGridSettings.color)
          }}
        >
          Reset
        </Button>
      </Flex>
    </>
  )
}
