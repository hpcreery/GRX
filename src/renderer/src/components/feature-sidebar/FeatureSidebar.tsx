import { ActionIcon, Affix, Badge, Code, Divider, ScrollArea, ThemeIcon, Transition, useMantineTheme } from "@mantine/core"
import { Card, Text } from "@mantine/core"
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
import { LayerInfo, QuerySelection } from "@src/renderer/engine/engine"
import classes from "./FeatureSidebar.module.css"
import { EditorConfigProvider } from "@src/contexts/EditorContext"
import { getUnitsConversion } from "@src/renderer/engine/utils"
import chroma from "chroma-js"
import { STANDARD_SYMBOLS, StandardSymbol } from "@src/renderer/data/shape/symbol/symbol"
import { AttributesType, FeatureTypeIdentifier, Units } from "@src/renderer/engine/types"
import { menuItems } from "@src/contexts/EditorContext"

interface ToolbarProps {}

function CornerIcon({ children }: { children: JSX.Element }): JSX.Element {
  const [hover, setHover] = useState<boolean>(false)
  return (
    <ThemeIcon
      size="sm"
      variant="outline"
      radius="sm"
      style={{
        position: "absolute",
        right: "0px",
        cursor: "pointer",
      }}
      className={classes.closeAll}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {hover ? <IconX /> : children}
    </ThemeIcon>
  )
}

export function FeatureSidebar(_props: ToolbarProps): JSX.Element {
  const [features, setFeatures] = useState<QuerySelection[]>([])
  const [mounted, setMounted] = useState<boolean>(false)
  const { units, renderer } = useContext(EditorConfigProvider)
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
            {Object.entries(value as AttributesType).map(([key, value]) => (
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
    renderer.engine.then(async (engine) => {
      await engine.clearSelection("main")
      await engine.render()
    })
  }

  useEffect(() => {
    const handler = (e): void => {
      // console.log("feature clicked", (e as CustomEvent<QueryFeature[]>).detail)
      const featuresTemp = (e as CustomEvent<QuerySelection[]>).detail
      if (featuresTemp.length > 0) {
        setMounted(true)
        setFeatures((e as CustomEvent<QuerySelection[]>).detail)
      } else {
        setMounted(false)
      }
      renderer.engine.then((engine) => {
        engine.getLayers("main").then((layers) => {
          setLayers(layers)
        })
      })
    }
    renderer.pointer.addEventListener(PointerEvents.POINTER_SELECT, handler)
    return (): void => {
      renderer.pointer.removeEventListener(PointerEvents.POINTER_SELECT, handler)
    }
  }, [])

  const getInfo = (selection: QuerySelection): JSX.Element => {
    const layer = layers.find((x) => x.id === selection.sourceLayer)
    let layerColor = "black"
    let layerName = "Unknown"
    if (layer) {
      layerColor = chroma.gl(layer.color[0], layer.color[1], layer.color[2]).hex()
      layerName = layer.name
    }
    switch (selection.shape.type) {
      case FeatureTypeIdentifier.LINE:
      case FeatureTypeIdentifier.DATUM_LINE:
        return (
          <>
            <CornerIcon>{selection.shape.type == FeatureTypeIdentifier.LINE ? <IconLine /> : <IconArrowUpBar />}</CornerIcon>
            <Text size="lg" fw={700}>
              {selection.shape.type == FeatureTypeIdentifier.LINE ? "Line" : "Datum Line"}
            </Text>
            <Badge style={{ marginBottom: "4px" }} autoContrast fullWidth radius="sm" color={layerColor}>
              {layerName}
            </Badge>
            <Text>
              Index: <Code>{selection.shape.index}</Code>
            </Text>
            <Text>
              Polarity: <Code>{selection.shape.polarity === 1 ? "+" : "-"}</Code>
            </Text>
            <Text>
              Start:{" "}
              <Code>
                X:{((selection.shape.xs * getUnitsConversion(units)) / getUnitsConversion(selection.units)).toFixed(3)}
                {units} Y:{((selection.shape.ys * getUnitsConversion(units)) / getUnitsConversion(selection.units)).toFixed(3)}
                {units}
              </Code>
            </Text>
            <Text>
              End:{" "}
              <Code>
                X:{((selection.shape.xe * getUnitsConversion(units)) / getUnitsConversion(selection.units)).toFixed(3)}
                {units} Y:{((selection.shape.ye * getUnitsConversion(units)) / getUnitsConversion(selection.units)).toFixed(3)}
                {units}
              </Code>
            </Text>
            <Text>
              Symbol: <Code>{STANDARD_SYMBOLS[selection.shape.symbol.symbol]}</Code>
            </Text>
            <Text>{getSymbolInfo(selection.shape.symbol, selection.units)}</Text>
            <Text>
              Attributes: <Code>{Object.keys(selection.shape.attributes).length}</Code>
            </Text>
            <Text>{getAttributes(selection.shape.attributes)}</Text>
          </>
        )
      case FeatureTypeIdentifier.PAD:
      case FeatureTypeIdentifier.DATUM_POINT:
        return (
          <>
            {selection.shape.symbol.type == FeatureTypeIdentifier.SYMBOL_DEFINITION
              ? ""
              : selection.children.map((child) => (
                  <>
                    {getInfo({
                      sourceLayer: selection.sourceLayer,
                      units: selection.units,
                      shape: child.shape,
                      snapPoint: selection.snapPoint,
                      children: [],
                    })}
                    <Divider my="sm" />
                  </>
                ))}
            <CornerIcon>
              {selection.shape.type == FeatureTypeIdentifier.DATUM_POINT ? (
                <IconNorthStar />
              ) : selection.shape.symbol.type == FeatureTypeIdentifier.SYMBOL_DEFINITION ? (
                <IconCircle />
              ) : (
                <IconPictureInPicture />
              )}
            </CornerIcon>
            <Text size="lg" fw={700}>
              {selection.shape.type == FeatureTypeIdentifier.DATUM_POINT ? (
                "Datum Point"
              ) : selection.shape.symbol.type == FeatureTypeIdentifier.MACRO_DEFINITION ? (
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
              Index: <Code>{selection.shape.index}</Code>
            </Text>
            <Text>
              Polarity: <Code>{selection.shape.polarity === 1 ? "+" : "-"}</Code>
            </Text>
            <Text>
              Center:{" "}
              <Code>
                X:{((selection.shape.x * getUnitsConversion(units)) / getUnitsConversion(selection.units)).toFixed(3)}
                {units} Y:{((selection.shape.y * getUnitsConversion(units)) / getUnitsConversion(selection.units)).toFixed(3)}
                {units}
              </Code>
            </Text>
            <Text>
              Resize Factor: <Code>{selection.shape.resize_factor}</Code>
            </Text>
            <Text>
              Mirror:{" "}
              <Code>
                X:{selection.shape.mirror_x === 1 ? "yes" : "no"} Y:{selection.shape.mirror_y === 1 ? "yes" : "no"}
              </Code>
            </Text>
            <Text>
              Rotation (ccw): <Code>{selection.shape.rotation}&deg;</Code>
            </Text>
            <Text>
              Symbol:{" "}
              <Code>
                {selection.shape.symbol.type == FeatureTypeIdentifier.SYMBOL_DEFINITION
                  ? STANDARD_SYMBOLS[selection.shape.symbol.symbol]
                  : selection.shape.symbol.id}
              </Code>
            </Text>
            {selection.shape.symbol.type == FeatureTypeIdentifier.SYMBOL_DEFINITION ? (
              <Text>{getSymbolInfo(selection.shape.symbol, selection.units)}</Text>
            ) : (
              ""
            )}
            <Text>
              Attributes: <Code>{Object.keys(selection.shape.attributes).length}</Code>
            </Text>
            <Text>{getAttributes(selection.shape.attributes)}</Text>
          </>
        )
      case FeatureTypeIdentifier.ARC:
      case FeatureTypeIdentifier.DATUM_ARC:
        return (
          <>
            <CornerIcon>{selection.shape.type == FeatureTypeIdentifier.ARC ? <IconVectorSpline /> : <IconArrowUpBar />}</CornerIcon>
            <Text size="lg" fw={700}>
              {selection.shape.type == FeatureTypeIdentifier.ARC ? "Arc" : "Datum Arc"}
            </Text>
            <Badge style={{ marginBottom: "4px" }} autoContrast fullWidth radius="sm" color={layerColor}>
              {layerName}
            </Badge>
            <Text>
              Index: <Code>{selection.shape.index}</Code>
            </Text>
            <Text>
              Polarity: <Code>{selection.shape.polarity === 1 ? "+" : "-"}</Code>
            </Text>
            <Text>
              Start:{" "}
              <Code>
                X:{((selection.shape.xs * getUnitsConversion(units)) / getUnitsConversion(selection.units)).toFixed(3)}
                {units} Y:{((selection.shape.ys * getUnitsConversion(units)) / getUnitsConversion(selection.units)).toFixed(3)}
                {units}
              </Code>
            </Text>
            <Text>
              End:{" "}
              <Code>
                X:{((selection.shape.xe * getUnitsConversion(units)) / getUnitsConversion(selection.units)).toFixed(3)}
                {units} Y:{((selection.shape.ye * getUnitsConversion(units)) / getUnitsConversion(selection.units)).toFixed(3)}
                {units}
              </Code>
            </Text>
            <Text>
              Center:{" "}
              <Code>
                X:{((selection.shape.xc * getUnitsConversion(units)) / getUnitsConversion(selection.units)).toFixed(3)}
                {units} Y:{((selection.shape.yc * getUnitsConversion(units)) / getUnitsConversion(selection.units)).toFixed(3)}
                {units}
              </Code>
            </Text>
            <Text>
              Rotation: <Code>{selection.shape.clockwise === 1 ? "clockwise" : "counter clockwise"}</Code>
            </Text>
            <Text>
              Symbol: <Code>{STANDARD_SYMBOLS[selection.shape.symbol.symbol]}</Code>
            </Text>
            <Text>{getSymbolInfo(selection.shape.symbol, selection.units)}</Text>
            <Text>
              Attributes: <Code>{Object.keys(selection.shape.attributes).length}</Code>
            </Text>
            <Text>{getAttributes(selection.shape.attributes)}</Text>
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
              Index: <Code>{selection.shape.index}</Code>
            </Text>
            <Text>
              Polarity: <Code>{selection.shape.polarity === 1 ? "+" : "-"}</Code>
            </Text>
            <Text>
              Islands: <Code>{selection.shape.contours.filter((x) => x.poly_type == 1).length}</Code>
            </Text>
            <Text>
              Holes: <Code>{selection.shape.contours.filter((x) => x.poly_type == 0).length}</Code>
            </Text>
            <Text>
              Edges: <Code>{selection.shape.contours.map((ctr) => ctr.segments.length).reduce((p, c) => p + c, 0)}</Code>
            </Text>
            <Text>
              Attributes: <Code>{Object.keys(selection.shape.attributes).length}</Code>
            </Text>
            <Text>{getAttributes(selection.shape.attributes)}</Text>
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
              Index: <Code>{selection.shape.index}</Code>
            </Text>
            <Text>
              Polarity: <Code>{selection.shape.polarity === 1 ? "+" : "-"}</Code>
            </Text>
            <Text>
              Width:{" "}
              <Code>
                {((selection.shape.width * getUnitsConversion(units)) / getUnitsConversion(selection.units)).toFixed(3)}
                {units}
              </Code>
            </Text>
            <Text>
              End Style: <Code>{selection.shape.pathtype}</Code>
            </Text>
            <Text>
              Corner Style: <Code>{selection.shape.cornertype}</Code>
            </Text>
            <Text>
              Qty Lines: <Code>{selection.shape.lines.length}</Code>
            </Text>
            <Text>
              Attributes: <Code>{Object.keys(selection.shape.attributes).length}</Code>
            </Text>
            <Text>{getAttributes(selection.shape.attributes)}</Text>
          </>
        )
      case FeatureTypeIdentifier.STEP_AND_REPEAT:
        return (
          <>
            {selection.children.map((child) => (
              <>
                {getInfo({
                  sourceLayer: selection.sourceLayer,
                  units: selection.units,
                  shape: child.shape,
                  snapPoint: selection.snapPoint,
                  children: [],
                })}
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
              Index: <Code>{selection.shape.index}</Code>
            </Text>
            <Text>
              Repeats: <Code>{selection.shape.repeats.length}</Code>
            </Text>
            <Text>
              Attributes: <Code>{Object.keys(selection.shape.attributes).length}</Code>
            </Text>
            <Text>{getAttributes(selection.shape.attributes)}</Text>
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

  const getAttributes = (attributes: AttributesType): JSX.Element => {
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
            <ActionIcon radius="sm" variant="subtle" onClick={clearSelection}>
              <IconX />
            </ActionIcon>
          </Affix>
        </Card>
      )}
    </Transition>
  )
}
