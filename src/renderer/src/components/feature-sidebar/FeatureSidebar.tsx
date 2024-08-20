import { ActionIcon, Affix, Badge, Code, Divider, ScrollArea, ThemeIcon, Transition, useMantineTheme } from "@mantine/core"
import { Card, Text } from "@mantine/core"
import { RenderEngine } from "@src/renderer"
import { useEffect, useState, useContext } from "react"
import { PointerEvents } from "@src/renderer"
import {
  IconCircle,
  IconLine,
  IconVectorSpline,
  IconPolygon,
  IconShape2,
  IconQuestionMark,
  IconX,
  IconPictureInPicture,
  IconReplace,
  IconArrowUpBar,
  IconNorthStar,
} from "@tabler/icons-react"
import { LayerInfo, QueryFeature } from "@src/renderer/engine"
import classes from "./FeatureSidebar.module.css"
import { ConfigEditorProvider } from "@src/contexts/ConfigEditor"
import { getUnitsConversion } from "@src/renderer/utils"
import chroma from "chroma-js"
import { STANDARD_SYMBOLS, StandardSymbol } from "@src/renderer/symbols"
import { AttributeCollection, FeatureTypeIdentifier, Units } from "@src/renderer/types"
import { menuItems } from "@src/contexts/EngineContext"

interface ToolbarProps {
  renderEngine: RenderEngine
}

function CornerIcon({ children }: { children: JSX.Element }): JSX.Element {
  return (
    <ThemeIcon
      size="sm"
      variant="outline"
      radius="sm"
      style={{
        position: "absolute",
        right: "0px",
      }}
    >
      {children}
    </ThemeIcon>
  )
}

export function FeatureSidebar({ renderEngine }: ToolbarProps): JSX.Element {
  const [features, setFeatures] = useState<QueryFeature[]>([])
  const [mounted, setMounted] = useState<boolean>(false)
  const { units } = useContext(ConfigEditorProvider)
  const [layers, setLayers] = useState<LayerInfo[]>([])
  const theme = useMantineTheme()

  function getSymbolInfo(symbol: StandardSymbol, shapeUnits: Units): (JSX.Element | null)[] {
    return Object.entries(symbol).map(([key, value], index) => {
      let representedValue = value
      if (key === "sym_num" || key === "symbol" || key === "type") return null
      if (value === 0) return null
      if (
        [
          "width",
          "height",
          "corner_radius",
          "outer_dia",
          "inner_dia",
          "line_width",
          "line_length",
          "gap",
          "cut_size",
          "ring_width",
          "ring_gap",
        ].includes(key)
      ) {
        representedValue = `${((value * getUnitsConversion(units)) / getUnitsConversion(shapeUnits)).toFixed(3)}${units}`
      }
      if (key === "attributes") {
        return (
          <>
            <Text key={index}>
              - {key}: <Code>{Object.keys(value).length}</Code>
            </Text>
            {Object.entries(value as AttributeCollection).map(([key, value]) => (
              <>
                <Text key={`${key}`} style={{ whiteSpace: "preserve" }}>
                  {" "}
                  ~ {key}: <Code>{value}</Code>
                </Text>
              </>
            ))}
          </>
        )
      }
      return (
        <Text key={index}>
          - {key}: <Code>{representedValue}</Code>
        </Text>
      )
    })
  }

  menuItems.push({
    key: "clear selection",
    icon: <IconX stroke={1.5} size={18} color={theme.colors.red[7]} />,
    title: "Clear Selection",
    onClick: clearSelection,
  })

  function clearSelection(): void {
    setMounted(false)
    renderEngine.backend.then(async (engine) => {
      await engine.clearSelection()
      await engine.render({ force: true })
    })
  }

  useEffect(() => {
    const handler = (e): void => {
      console.log("feature clicked", (e as CustomEvent<QueryFeature[]>).detail)
      const featuresTemp = (e as CustomEvent<QueryFeature[]>).detail
      if (featuresTemp.length > 0) {
        setMounted(true)
        setFeatures((e as CustomEvent<QueryFeature[]>).detail)
      } else {
        setMounted(false)
      }
      renderEngine.backend.then((backend) => {
        backend.getLayers().then((layers) => {
          setLayers(layers)
        })
      })
    }
    renderEngine.pointer.addEventListener(PointerEvents.POINTER_SELECT, handler)
    return (): void => {
      renderEngine.pointer.removeEventListener(PointerEvents.POINTER_SELECT, handler)
    }
  }, [])

  const getInfo = (feature: QueryFeature): JSX.Element => {
    const layer = layers.find((x) => x.uid === feature.layer)
    let layerColor = "black"
    let layerName = "Unknown"
    if (layer) {
      layerColor = chroma.gl(layer.color[0], layer.color[1], layer.color[2]).hex()
      layerName = layer.name
    }
    switch (feature.type) {
      case FeatureTypeIdentifier.LINE:
      case FeatureTypeIdentifier.DATUM_LINE:
        return (
          <>
            <CornerIcon>{feature.type == FeatureTypeIdentifier.LINE ? <IconLine /> : <IconArrowUpBar />}</CornerIcon>
            <Text size="lg" fw={700}>
              {feature.type == FeatureTypeIdentifier.LINE ? "Line" : "Datum Line"}
            </Text>
            <Badge style={{ marginBottom: "4px" }} autoContrast fullWidth radius="sm" color={layerColor}>
              {layerName}
            </Badge>
            <Text>
              Index: <Code>{feature.index}</Code>
            </Text>
            <Text>
              Polarity: <Code>{feature.polarity === 1 ? "+" : "-"}</Code>
            </Text>
            <Text>
              Start:{" "}
              <Code>
                X:{((feature.xs * getUnitsConversion(units)) / getUnitsConversion(feature.units)).toFixed(3)}
                {units} Y:{((feature.ys * getUnitsConversion(units)) / getUnitsConversion(feature.units)).toFixed(3)}
                {units}
              </Code>
            </Text>
            <Text>
              End:{" "}
              <Code>
                X:{((feature.xe * getUnitsConversion(units)) / getUnitsConversion(feature.units)).toFixed(3)}
                {units} Y:{((feature.ye * getUnitsConversion(units)) / getUnitsConversion(feature.units)).toFixed(3)}
                {units}
              </Code>
            </Text>
            <Text>
              Symbol: <Code>{STANDARD_SYMBOLS[feature.symbol.symbol]}</Code>
            </Text>
            <Text>{getSymbolInfo(feature.symbol, feature.units)}</Text>
            <Text>
              Attributes: <Code>{Object.keys(feature.attributes).length}</Code>
            </Text>
            <Text>{getAttributes(feature.attributes)}</Text>
          </>
        )
      case FeatureTypeIdentifier.PAD:
      case FeatureTypeIdentifier.DATUM_POINT:
        return (
          <>
            {feature.symbol.type == FeatureTypeIdentifier.SYMBOL_DEFINITION
              ? ""
              : feature.symbol.shapes.map((shape) => (
                  <>
                    {getInfo(Object.assign(shape, { layer: feature.layer, units: feature.units }))}
                    <Divider my="sm" />
                  </>
                ))}
            <CornerIcon>
              {feature.type == FeatureTypeIdentifier.DATUM_POINT ? (
                <IconNorthStar />
              ) : feature.symbol.type == FeatureTypeIdentifier.SYMBOL_DEFINITION ? (
                <IconCircle />
              ) : (
                <IconPictureInPicture />
              )}
            </CornerIcon>
            <Text size="lg" fw={700}>
              {feature.type == FeatureTypeIdentifier.DATUM_POINT ? (
                "Datum Point"
              ) : feature.symbol.type == FeatureTypeIdentifier.MACRO_DEFINITION ? (
                <>
                  Nested in
                  <br />
                  Macro Pad
                </>
              ) : (
                <>Pad</>
              )}
            </Text>
            <Badge style={{ marginBottom: "4px" }} autoContrast fullWidth radius="sm" color={layerColor}>
              {layerName}
            </Badge>
            <Text>
              Index: <Code>{feature.index}</Code>
            </Text>
            <Text>
              Polarity: <Code>{feature.polarity === 1 ? "+" : "-"}</Code>
            </Text>
            <Text>
              Center:{" "}
              <Code>
                X:{((feature.x * getUnitsConversion(units)) / getUnitsConversion(feature.units)).toFixed(3)}
                {units} Y:{((feature.y * getUnitsConversion(units)) / getUnitsConversion(feature.units)).toFixed(3)}
                {units}
              </Code>
            </Text>
            <Text>
              Resize Factor: <Code>{feature.resize_factor}</Code>
            </Text>
            <Text>
              Mirror:{" "}
              <Code>
                X:{feature.mirror_x === 1 ? "yes" : "no"} Y:{feature.mirror_y === 1 ? "yes" : "no"}
              </Code>
            </Text>
            <Text>
              Rotation (cw): <Code>{feature.rotation}&deg;</Code>
            </Text>
            <Text>
              Symbol:{" "}
              <Code>
                {feature.symbol.type == FeatureTypeIdentifier.SYMBOL_DEFINITION ? STANDARD_SYMBOLS[feature.symbol.symbol] : feature.symbol.id}
              </Code>
            </Text>
            {feature.symbol.type == FeatureTypeIdentifier.SYMBOL_DEFINITION ? <Text>{getSymbolInfo(feature.symbol, feature.units)}</Text> : ""}
            <Text>
              Attributes: <Code>{Object.keys(feature.attributes).length}</Code>
            </Text>
            <Text>{getAttributes(feature.attributes)}</Text>
          </>
        )
      case FeatureTypeIdentifier.ARC:
      case FeatureTypeIdentifier.DATUM_ARC:
        return (
          <>
            <CornerIcon>{feature.type == FeatureTypeIdentifier.ARC ? <IconVectorSpline /> : <IconArrowUpBar />}</CornerIcon>
            <Text size="lg" fw={700}>
              {feature.type == FeatureTypeIdentifier.ARC ? "Arc" : "Datum Arc"}
            </Text>
            <Badge style={{ marginBottom: "4px" }} autoContrast fullWidth radius="sm" color={layerColor}>
              {layerName}
            </Badge>
            <Text>
              Index: <Code>{feature.index}</Code>
            </Text>
            <Text>
              Polarity: <Code>{feature.polarity === 1 ? "+" : "-"}</Code>
            </Text>
            <Text>
              Start:{" "}
              <Code>
                X:{((feature.xs * getUnitsConversion(units)) / getUnitsConversion(feature.units)).toFixed(3)}
                {units} Y:{((feature.ys * getUnitsConversion(units)) / getUnitsConversion(feature.units)).toFixed(3)}
                {units}
              </Code>
            </Text>
            <Text>
              End:{" "}
              <Code>
                X:{((feature.xe * getUnitsConversion(units)) / getUnitsConversion(feature.units)).toFixed(3)}
                {units} Y:{((feature.ye * getUnitsConversion(units)) / getUnitsConversion(feature.units)).toFixed(3)}
                {units}
              </Code>
            </Text>
            <Text>
              Center:{" "}
              <Code>
                X:{((feature.xc * getUnitsConversion(units)) / getUnitsConversion(feature.units)).toFixed(3)}
                {units} Y:{((feature.yc * getUnitsConversion(units)) / getUnitsConversion(feature.units)).toFixed(3)}
                {units}
              </Code>
            </Text>
            <Text>
              Rotation: <Code>{feature.clockwise === 1 ? "clockwise" : "counter clockwise"}</Code>
            </Text>
            <Text>
              Symbol: <Code>{STANDARD_SYMBOLS[feature.symbol.symbol]}</Code>
            </Text>
            <Text>{getSymbolInfo(feature.symbol, feature.units)}</Text>
            <Text>
              Attributes: <Code>{Object.keys(feature.attributes).length}</Code>
            </Text>
            <Text>{getAttributes(feature.attributes)}</Text>
          </>
        )
      case FeatureTypeIdentifier.SURFACE:
        return (
          <>
            <CornerIcon>
              <IconPolygon />
            </CornerIcon>
            <Text size="lg" fw={700}>
              Surface
            </Text>
            <Badge style={{ marginBottom: "4px" }} autoContrast fullWidth radius="sm" color={layerColor}>
              {layerName}
            </Badge>
            <Text>
              Index: <Code>{feature.index}</Code>
            </Text>
            <Text>
              Polarity: <Code>{feature.polarity === 1 ? "+" : "-"}</Code>
            </Text>
            <Text>
              Islands: <Code>{feature.contours.filter((x) => x.poly_type == 1).length}</Code>
            </Text>
            <Text>
              Holes: <Code>{feature.contours.filter((x) => x.poly_type == 0).length}</Code>
            </Text>
            <Text>
              Edges: <Code>{feature.contours.map((ctr) => ctr.segments.length).reduce((p, c) => p + c, 0)}</Code>
            </Text>
            <Text>
              Attributes: <Code>{Object.keys(feature.attributes).length}</Code>
            </Text>
            <Text>{getAttributes(feature.attributes)}</Text>
          </>
        )
      case FeatureTypeIdentifier.POLYLINE:
        return (
          <>
            <CornerIcon>
              <IconShape2 />
            </CornerIcon>
            <Text size="lg" fw={700}>
              Polyline
            </Text>
            <Badge style={{ marginBottom: "4px" }} autoContrast fullWidth radius="sm" color={layerColor}>
              {layerName}
            </Badge>
            <Text>
              Index: <Code>{feature.index}</Code>
            </Text>
            <Text>
              Polarity: <Code>{feature.polarity === 1 ? "+" : "-"}</Code>
            </Text>
            <Text>
              Width:{" "}
              <Code>
                {((feature.width * getUnitsConversion(units)) / getUnitsConversion(feature.units)).toFixed(3)}
                {units}
              </Code>
            </Text>
            <Text>
              End Style: <Code>{feature.pathtype}</Code>
            </Text>
            <Text>
              Corner Style: <Code>{feature.cornertype}</Code>
            </Text>
            <Text>
              Qty Lines: <Code>{feature.lines.length}</Code>
            </Text>
            <Text>
              Attributes: <Code>{Object.keys(feature.attributes).length}</Code>
            </Text>
            <Text>{getAttributes(feature.attributes)}</Text>
          </>
        )
      case FeatureTypeIdentifier.STEP_AND_REPEAT:
        return (
          <>
            {feature.shapes.map((shape) => (
              <>
                {getInfo(Object.assign(shape, { layer: feature.layer, units: feature.units }))}
                <Divider my="sm" />
              </>
            ))}
            <CornerIcon>
              <IconReplace />
            </CornerIcon>
            <Text size="lg" fw={700}>
              Nested in
              <br />
              Step and Repeat
            </Text>
            <Badge style={{ marginBottom: "4px" }} autoContrast fullWidth radius="sm" color={layerColor}>
              {layerName}
            </Badge>
            <Text>
              Index: <Code>{feature.index}</Code>
            </Text>
            <Text>
              Repeats: <Code>{feature.repeats.length}</Code>
            </Text>
            <Text>
              Attributes: <Code>{Object.keys(feature.attributes).length}</Code>
            </Text>
            <Text>{getAttributes(feature.attributes)}</Text>
          </>
        )
      default:
        return (
          <>
            <CornerIcon>
              <IconQuestionMark />
            </CornerIcon>
            <Badge style={{ marginBottom: "4px" }} autoContrast fullWidth radius="sm" color={layerColor}>
              {layerName}
            </Badge>
            <Text size="lg" fw={700}>
              Unknown
            </Text>
          </>
        )
    }
  }

  const getAttributes = (attributes: AttributeCollection): JSX.Element => {
    return (
      <>
        {Object.entries(attributes).map(([key, value]) => (
          <>
            <Text key={`${key}`}>
              - {key}: <Code>{value}</Code>
            </Text>
          </>
        ))}
      </>
    )
  }

  return (
    <Transition mounted={mounted} transition="slide-left" duration={400} exitDuration={400} timingFunction="ease">
      {(styles) => (
        <Card
          radius="md"
          withBorder
          style={{
            width: "250px",
            height: "calc(100vh - 124px)",
            position: "absolute",
            top: 64,
            right: 10,
            overflowY: "auto",
            overflowX: "hidden",
            pointerEvents: "all",
            ...styles,
          }}
          mod={["transparent"]}
          padding={4}
        >
          <ScrollArea scrollbars="y" className={classes.fixtable}>
            {features.map((feature, index) => (
              <Card
                key={index}
                shadow="sm"
                padding="sm"
                radius="sm"
                withBorder
                mod={["transparent"]}
                style={{
                  paddingBottom: "1px",
                  marginBottom: index == features.length - 1 ? "0px" : "5px",
                  width: "100%",
                }}
              >
                <ScrollArea scrollbars="x" offsetScrollbars>
                  <Text size="xs" truncate="end">
                    {getInfo(feature)}
                  </Text>
                </ScrollArea>
              </Card>
            ))}
          </ScrollArea>
          <Affix withinPortal={false} position={{ bottom: 5, right: 10 }}>
            <ActionIcon radius="sm" variant="subtle" onClick={() => {}}>
              <IconX />
            </ActionIcon>
          </Affix>
        </Card>
      )}
    </Transition>
  )
}
