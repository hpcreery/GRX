import React from "react"
import { RenderEngine } from "@src/renderer"
import { ConfigEditorProvider } from "@src/contexts/ConfigEditor"
import chroma from "chroma-js"
import { Text, Switch, Divider, Group, Flex, useMantineTheme, useMantineColorScheme, ColorPicker, Radio } from "@mantine/core"

interface SettingsModalProps {
  renderEngine: RenderEngine
}

export default function GeneralSettingsModal({ renderEngine }: SettingsModalProps): JSX.Element | null {
  const { transparency, setTransparency, setPrimaryColor, units, setUnits } = React.useContext(EditorConfigProvider)
  const theme = useMantineTheme()
  const colors = useMantineColorScheme()

  React.useEffect(() => {
    renderEngine.backend.then((backend) => backend.setMeasurementUnits(units))
  }, [units])

  return (
    <>
      <Flex align="center" style={{ width: "100%" }} justify="space-between">
        <Text>Units</Text>
        <Group mt="xs">
          <Radio value="mm" label="mm" checked={units == "mm"} onChange={(): void => setUnits("mm")} />
          <Radio value="in" label="inch" checked={units == "inch"} onChange={(): void => setUnits("inch")} />
          <Radio value="cm" label="cm" checked={units == "cm"} onChange={(): void => setUnits("cm")} />
          <Radio value="mil" label="mil" checked={units == "mil"} onChange={(): void => setUnits("mil")} />
        </Group>
      </Flex>
      <Divider my="sm" />
      <Flex align="center" style={{ width: "100%" }} justify="space-between">
        <Text>Dark Mode</Text>
        <Switch
          defaultChecked={colors.colorScheme === "dark"}
          onChange={(event): void => {
            if (event.currentTarget.checked) {
              colors.setColorScheme("dark")
              renderEngine.settings.BACKGROUND_COLOR = chroma(theme.colors.dark[8]).alpha(0).gl()
            } else {
              colors.setColorScheme("light")
              renderEngine.settings.BACKGROUND_COLOR = chroma(theme.colors.dark[8]).alpha(0).gl()
            }
          }}
        />
      </Flex>
      <Divider my="sm" />
      <Flex align="center" style={{ width: "100%" }} justify="space-between">
        <Text>Color</Text>
        <ColorPicker
          withPicker={false}
          onChange={(color): void => {
            const colorName = Object.keys(theme.colors).find((key) => theme.colors[key][9] === color)
            theme.primaryColor = colorName || "teal"
            setPrimaryColor(colorName || "teal")
          }}
          swatches={[...Object.values(theme.colors).map((x) => x[9])]}
        />
      </Flex>
      <Divider my="sm" />
      <Flex align="center" style={{ width: "100%" }} justify="space-between">
        <Text>Transparency</Text>
        <Switch
          defaultChecked={transparency}
          onChange={(event): void => {
            setTransparency(event.currentTarget.checked)
          }}
        />
      </Flex>
    </>
  )
}
