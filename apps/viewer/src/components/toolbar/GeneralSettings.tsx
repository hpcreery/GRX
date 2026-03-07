import { ColorPicker, Divider, Flex, Group, Radio, Switch, Text, useMantineColorScheme, useMantineTheme } from "@mantine/core"
import { useLocalStorage } from "@mantine/hooks"
import { EditorConfigProvider } from "@src/contexts/EditorContext"
import { ThemeConfigProvider } from "@src/contexts/ThemeContext"
import chroma from "chroma-js"
import React, { type JSX } from "react"

type SettingsModalProps = {}

export default function GeneralSettingsModal(_props: SettingsModalProps): JSX.Element | null {
  const { units, setUnits, renderer } = React.useContext(EditorConfigProvider)
  const { transparency, setTransparency, setPrimaryColor } = React.useContext(ThemeConfigProvider)
  const theme = useMantineTheme()
  const colors = useMantineColorScheme()
  const [useHiDPI, setUseHiDPI] = useLocalStorage<boolean>({
    key: "engine:USE_HIDPI",
    defaultValue: renderer.canvasSettings.hidpi,
  })

  React.useEffect(() => {
    renderer.engine.interface.update_measurement_settings({ units })
  }, [units])
  React.useEffect(() => {
    renderer.canvasSettings.hidpi = useHiDPI
  }, [useHiDPI])

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
              renderer.engine.interface.set_engine_settings({ BACKGROUND_COLOR: chroma(theme.colors.dark[8]).alpha(0).gl() })
            } else {
              colors.setColorScheme("light")
              renderer.engine.interface.set_engine_settings({ BACKGROUND_COLOR: chroma(theme.colors.dark[8]).alpha(0).gl() })
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
      <Divider my="sm" />
      <Flex align="center" style={{ width: "100%" }} justify="space-between">
        <Text>HiDPI</Text>
        <Switch
          defaultChecked={useHiDPI}
          onChange={(event): void => {
            setUseHiDPI(event.currentTarget.checked)
          }}
        />
      </Flex>
    </>
  )
}
