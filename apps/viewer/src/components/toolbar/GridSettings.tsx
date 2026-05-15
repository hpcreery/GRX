import { settings, utils } from "@grx/engine"
import { Button, ColorPicker, Divider, Flex, Group, Modal, NumberInput, SegmentedControl, Space, Switch, Text } from "@mantine/core"
import { type UseDisclosureReturnValue, useLocalStorage } from "@mantine/hooks"
import { actions } from "@src/contexts/Spotlight"
import { IconGrid4x4 } from "@tabler/icons-react"
import chroma from "chroma-js"
import { vec4 } from "gl-matrix"
import React, { type JSX, useEffect } from "react"
import { EditorConfigProvider } from "../../contexts/EditorContext"

type GridSettingsProps = {
  modalDisclosure: UseDisclosureReturnValue
}
const defaultGridSettings = JSON.parse(JSON.stringify(settings.gridSettings))

export default function GridSettings(props: GridSettingsProps): JSX.Element | null {
  const { units, renderer } = React.useContext(EditorConfigProvider)
  const [spacingX, setSpacingX] = useLocalStorage<number>({
    key: "engine:grid:spacing_x",
    defaultValue: 0,
  })
  const [spacingY, setSpacingY] = useLocalStorage<number>({
    key: "engine:grid:spacing_y",
    defaultValue: 0,
  })
  const [offsetX, setOffsetX] = useLocalStorage<number>({
    key: "engine:grid:offset_x",
    defaultValue: 0,
  })
  const [offsetY, setOffsetY] = useLocalStorage<number>({
    key: "engine:grid:offset_y",
    defaultValue: 0,
  })
  const [enabled, setEnabled] = useLocalStorage<boolean>({
    key: "engine:grid:enabled",
    defaultValue: false,
  })
  const [type, setType] = useLocalStorage<"lines" | "dots">({
    key: "engine:grid:type",
    defaultValue: "lines",
  })
  const [color, setColor] = useLocalStorage<vec4>({
    key: "engine:grid:color",
    defaultValue: vec4.fromValues(0.5, 0.5, 0.5, 1),
  })
  const [gridSettingsModal, gridSettingsModalHandlers] = props.modalDisclosure

  actions.push({
    id: "open grid settings modal",
    label: "Open Grid Settings",
    description: "Show grid settings",
    onClick: gridSettingsModalHandlers.open,
    leftSection: <IconGrid4x4 />,
    // rightSection: <Kbd>A</Kbd>
  })

  useEffect(() => {
    renderer.engine.interface.update_grid_settings({
      spacing_x: spacingX,
      spacing_y: spacingY,
      offset_x: offsetX,
      offset_y: offsetY,
      enabled: enabled,
      type: type,
      color: color,
    })
  }, [spacingX, spacingY, offsetX, offsetY, enabled, type, color])

  return (
    <Modal title="Grid Settings" keepMounted opened={gridSettingsModal} onClose={gridSettingsModalHandlers.close}>
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
            value={Math.round((spacingX * utils.baseUnitsConversionFactor(units) + Number.EPSILON) * 1000) / 1000}
            onChange={(value): void => setSpacingX(Number(value) / utils.baseUnitsConversionFactor(units))}
          />
          Y:
          <NumberInput
            allowNegative={false}
            suffix={` ${units}`}
            value={Math.round((spacingY * utils.baseUnitsConversionFactor(units) + Number.EPSILON) * 1000) / 1000}
            onChange={(value): void => setSpacingY(Number(value) / utils.baseUnitsConversionFactor(units))}
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
            value={Math.round((offsetX * utils.baseUnitsConversionFactor(units) + Number.EPSILON) * 1000) / 1000}
            onChange={(value): void => setOffsetX(Number(value) / utils.baseUnitsConversionFactor(units))}
          />
          Y:
          <NumberInput
            allowNegative={false}
            suffix={` ${units}`}
            value={Math.round((offsetY * utils.baseUnitsConversionFactor(units) + Number.EPSILON) * 1000) / 1000}
            onChange={(value): void => setOffsetY(Number(value) / utils.baseUnitsConversionFactor(units))}
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
    </Modal>
  )
}
