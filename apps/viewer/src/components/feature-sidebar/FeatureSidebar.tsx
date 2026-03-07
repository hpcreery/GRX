import { data, type engine, PointerEvents, type Renderer, types, utils } from "@grx/engine"

const { FeatureTypeIdentifier, SymbolTypeIdentifier } = types

import { ActionIcon, Affix, Badge, Card, Code, Divider, ScrollArea, Text, ThemeIcon, Transition, useMantineTheme } from "@mantine/core"
import { EditorConfigProvider, menuItems } from "@src/contexts/EditorContext"
import {
  IconArrowUpBar,
  IconCircle,
  IconLine,
  IconNorthStar,
  IconPictureInPicture,
  IconPolygon,
  IconQuestionMark,
  IconReplace,
  IconShape2,
  IconVectorSpline,
  IconX,
} from "@tabler/icons-react"
import chroma from "chroma-js"
import type { vec3 } from "gl-matrix"
import { type JSX, useContext, useEffect, useState } from "react"
import classes from "./FeatureSidebar.module.css"

type ToolbarProps = {}

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
  const [features, setFeatures] = useState<engine.QuerySelection[]>([])
  const [mounted, setMounted] = useState<boolean>(false)
  const { renderer } = useContext(EditorConfigProvider)
  const theme = useMantineTheme()

  menuItems.push({
    key: "clear selection",
    icon: <IconX stroke={1.5} size={18} color={theme.colors.red[7]} />,
    title: "Clear Selection",
    onClick: clearSelection,
  })

  async function clearSelection(): Promise<void> {
    setMounted(false)
    await renderer.engine.interface.delete_view_selection("main")
    await renderer.engine.render()
  }

  useEffect(() => {
    const handler = (e: Event): void => {
      const featuresTemp = (e as CustomEvent<engine.QuerySelection[]>).detail
      if (featuresTemp.length > 0) {
        setMounted(true)
        setFeatures((e as CustomEvent<engine.QuerySelection[]>).detail)
      } else {
        setMounted(false)
      }
    }
    renderer.pointer.addEventListener(PointerEvents.POINTER_SELECT, handler)
    return (): void => {
      renderer.pointer.removeEventListener(PointerEvents.POINTER_SELECT, handler)
    }
  }, [])

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
                    {/* {getInfo(feature)} */}
                    <FeatureInfo layer={feature.sourceLayer} renderer={renderer} selection={feature} />
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

interface FeatureInfoProps {
  layer: string
  selection: types.ShapeDistance
  renderer: Renderer
}

function FeatureInfo(props: FeatureInfoProps): JSX.Element {
  const { units, renderer } = useContext(EditorConfigProvider)
  const [color, setColor] = useState<vec3>([0, 0, 0])
  const { layer, selection } = props

  useEffect(() => {
    renderer.engine.interface.read_view_layer_color("main", layer).then((color) => {
      setColor(color)
    })
  }, [layer])

  const layerColor = chroma.gl(color[0], color[1], color[2]).hex()

  function getSymbolInfo(symbol: data.shape.symbol.StandardSymbol): (JSX.Element | null)[] {
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
        representedValue = `${(value / utils.baseUnitsConversionFactor(units)).toFixed(3)}${units}`
      }
      if (key === "attributes") {
        return (
          <>
            <Text key={index}>
              - {key}: <Code>{Object.keys(value).length}</Code>
            </Text>
            {Object.entries(value as types.AttributesType).map(([key, value]) => (
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
  const getAttributes = (attributes: types.AttributesType): JSX.Element => {
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
  const getInfo = (): JSX.Element => {
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
              {layer}
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
                X:{(selection.shape.xs / utils.baseUnitsConversionFactor(units)).toFixed(3)}
                {units} Y:{(selection.shape.ys / utils.baseUnitsConversionFactor(units)).toFixed(3)}
                {units}
              </Code>
            </Text>
            <Text>
              End:{" "}
              <Code>
                X:{(selection.shape.xe / utils.baseUnitsConversionFactor(units)).toFixed(3)}
                {units} Y:{(selection.shape.ye / utils.baseUnitsConversionFactor(units)).toFixed(3)}
                {units}
              </Code>
            </Text>
            <Text>
              Symbol: <Code>{data.shape.symbol.STANDARD_SYMBOLS[selection.shape.symbol.symbol]}</Code>
            </Text>
            <Text>{getSymbolInfo(selection.shape.symbol)}</Text>
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
            {selection.shape.symbol.type == SymbolTypeIdentifier.SYMBOL_DEFINITION
              ? ""
              : selection.children.map((child) => (
                  <>
                    <FeatureInfo layer={layer} selection={child} renderer={renderer} />
                    <Divider my="sm" />
                  </>
                ))}
            <CornerIcon>
              {selection.shape.type == FeatureTypeIdentifier.DATUM_POINT ? (
                <IconNorthStar />
              ) : selection.shape.symbol.type == SymbolTypeIdentifier.SYMBOL_DEFINITION ? (
                <IconCircle />
              ) : (
                <IconPictureInPicture />
              )}
            </CornerIcon>
            <Text size="lg" fw={700}>
              {selection.shape.type == FeatureTypeIdentifier.DATUM_POINT ? (
                "Datum Point"
              ) : selection.shape.symbol.type == SymbolTypeIdentifier.MACRO_DEFINITION ? (
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
              {layer}
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
                X:{(selection.shape.x / utils.baseUnitsConversionFactor(units)).toFixed(3)}
                {units} Y:{(selection.shape.y / utils.baseUnitsConversionFactor(units)).toFixed(3)}
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
                {selection.shape.symbol.type == SymbolTypeIdentifier.SYMBOL_DEFINITION
                  ? data.shape.symbol.STANDARD_SYMBOLS[selection.shape.symbol.symbol]
                  : selection.shape.symbol.id}
              </Code>
            </Text>
            {selection.shape.symbol.type == SymbolTypeIdentifier.SYMBOL_DEFINITION ? <Text>{getSymbolInfo(selection.shape.symbol)}</Text> : ""}
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
              {layer}
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
                X:{(selection.shape.xs / utils.baseUnitsConversionFactor(units)).toFixed(3)}
                {units} Y:{(selection.shape.ys / utils.baseUnitsConversionFactor(units)).toFixed(3)}
                {units}
              </Code>
            </Text>
            <Text>
              End:{" "}
              <Code>
                X:{(selection.shape.xe / utils.baseUnitsConversionFactor(units)).toFixed(3)}
                {units} Y:{(selection.shape.ye / utils.baseUnitsConversionFactor(units)).toFixed(3)}
                {units}
              </Code>
            </Text>
            <Text>
              Center:{" "}
              <Code>
                X:{(selection.shape.xc / utils.baseUnitsConversionFactor(units)).toFixed(3)}
                {units} Y:{(selection.shape.yc / utils.baseUnitsConversionFactor(units)).toFixed(3)}
                {units}
              </Code>
            </Text>
            <Text>
              Rotation: <Code>{selection.shape.clockwise === 1 ? "clockwise" : "counter clockwise"}</Code>
            </Text>
            <Text>
              Symbol: <Code>{data.shape.symbol.STANDARD_SYMBOLS[selection.shape.symbol.symbol]}</Code>
            </Text>
            <Text>{getSymbolInfo(selection.shape.symbol)}</Text>
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
              {layer}
            </Badge>
            <Text>
              Index: <Code>{selection.shape.index}</Code>
            </Text>
            <Text>
              Polarity: <Code>{selection.shape.polarity === 1 ? "+" : "-"}</Code>
            </Text>
            <Text>
              Islands: <Code>{selection.shape.contours.filter((x: data.shape.Contour) => x.poly_type == 1).length}</Code>
            </Text>
            <Text>
              Holes: <Code>{selection.shape.contours.filter((x: data.shape.Contour) => x.poly_type == 0).length}</Code>
            </Text>
            <Text>
              Edges:{" "}
              <Code>{selection.shape.contours.map((ctr: data.shape.Contour) => ctr.segments.length).reduce((p: number, c: number) => p + c, 0)}</Code>
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
              {layer}
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
                {(selection.shape.width / utils.baseUnitsConversionFactor(units)).toFixed(3)}
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
                <FeatureInfo layer={layer} selection={child} renderer={renderer} />
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
              {layer}
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
              {layer}
            </Badge>
            <Text size="lg" fw={700}>
              Unknown
            </Text>
          </>
        )
    }
  }
  return getInfo()
}
