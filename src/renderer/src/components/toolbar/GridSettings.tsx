import React, { useEffect } from "react"
import { RenderEngine } from "@src/renderer"
import { ConfigEditorProvider } from "../../contexts/ConfigEditor"
import chroma from "chroma-js"
import { Text, Switch, Divider, Group, Flex, ColorPicker, SegmentedControl, NumberInput } from "@mantine/core"
import { getUnitsConversion } from "@src/renderer/utils"
import { vec4 } from "gl-matrix"

interface GridSettingsProps {
  renderEngine: RenderEngine
}

export default function GridSettings({ renderEngine }: GridSettingsProps): JSX.Element | null {
  const { units } = React.useContext(ConfigEditorProvider)
  const [spacingX, setSpacingX] = React.useState<number>(renderEngine.grid.spacing_x)
  const [spacingY, setSpacingY] = React.useState<number>(renderEngine.grid.spacing_y)
  const [offsetX, setOffsetX] = React.useState<number>(renderEngine.grid.offset_x)
  const [offsetY, setOffsetY] = React.useState<number>(renderEngine.grid.offset_y)
  const [enabled, setEnabled] = React.useState<boolean>(renderEngine.grid.enabled)
  const [type, setType] = React.useState<"lines" | "dots">(renderEngine.grid.type)
  const [color, setColor] = React.useState<vec4>(renderEngine.grid.color)

  useEffect(() => {
    renderEngine.grid.spacing_x = spacingX
    renderEngine.grid.spacing_y = spacingY
    renderEngine.grid.offset_x = offsetX
    renderEngine.grid.offset_y = offsetY
    renderEngine.grid.enabled = enabled
    renderEngine.grid.type = type
    renderEngine.grid.color = color
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
            value={Math.round((spacingX * getUnitsConversion(units) + Number.EPSILON) * 1000) / 1000}
            onChange={(value): void => setSpacingX(Number(value) / getUnitsConversion(units))}
          />
          Y:
          <NumberInput
            allowNegative={false}
            suffix={` ${units}`}
            value={Math.round((spacingY * getUnitsConversion(units) + Number.EPSILON) * 1000) / 1000}
            onChange={(value): void => setSpacingY(Number(value) / getUnitsConversion(units))}
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
            value={Math.round((offsetX * getUnitsConversion(units) + Number.EPSILON) * 1000) / 1000}
            onChange={(value): void => setOffsetX(Number(value) / getUnitsConversion(units))}
          />
          Y:
          <NumberInput
            allowNegative={false}
            suffix={` ${units}`}
            value={Math.round((offsetY * getUnitsConversion(units) + Number.EPSILON) * 1000) / 1000}
            onChange={(value): void => setOffsetY(Number(value) / getUnitsConversion(units))}
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
    </>
  )
}
