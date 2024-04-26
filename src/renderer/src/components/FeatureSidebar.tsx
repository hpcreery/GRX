import { ActionIcon, Affix, Code, ScrollArea, ThemeIcon, Transition } from '@mantine/core';
import { Card, Text } from '@mantine/core';
import { RenderEngine } from '@src/renderer';
import { useEffect, useState, useContext } from 'react';
import { PointerEvents } from '@src/renderer';
import {
  IconCircle,
  IconLine,
  IconVectorSpline,
  IconPolygon,
  IconShape2,
  IconQuestionMark,
  IconX
} from '@tabler/icons-react'
import { QueryFeature } from '@src/renderer/engine';
import classes from './FeatureSidebar.module.css';
import { ConfigEditorProvider } from '@src/contexts/ConfigEditor';
import { getUnitsConversion } from '@src/renderer/utils';

interface ToolbarProps {
  renderEngine: RenderEngine
}

function CornerIcon({ children }: { children: JSX.Element }): JSX.Element {
  return (
    <ThemeIcon size='sm' variant="outline" radius="sm" style={{
      position: 'absolute',
      right: '0px',
    }}>
      {children}
    </ThemeIcon>
  )
}

export function FeatureSidebar({ renderEngine }: ToolbarProps): JSX.Element {
  const [features, setFeatures] = useState<QueryFeature[]>([])
  const [mounted, setMounted] = useState<boolean>(false)
  const { units } = useContext(ConfigEditorProvider)


  useEffect(() => {
    const handler = (e): void => {
      console.log('feature clicked', (e as CustomEvent<QueryFeature[]>).detail)
      const featuresTemp = (e as CustomEvent<QueryFeature[]>).detail
      if (featuresTemp.length > 0) {
        setMounted(true)
        setFeatures((e as CustomEvent<QueryFeature[]>).detail)
      } else {
        setMounted(false)
      }
    }
    renderEngine.pointer.addEventListener(PointerEvents.POINTER_SELECT, handler)
    return () => {
      renderEngine.pointer.removeEventListener(PointerEvents.POINTER_SELECT, handler)
    }
  }, [])

  const getInfo = (feature: QueryFeature): JSX.Element => {
    switch (feature.type) {
      case 'line':
        return <>
          <CornerIcon>
            <IconLine />
          </CornerIcon>
          <Text size="lg" fw={700} c='white'>
            Line
          </Text>
          <Text>
            Layer: <Code>{feature.layer}</Code>
          </Text>
          <Text>
            Index: <Code>{feature.index}</Code>
          </Text>
          <Text>
            Polarity: <Code>{feature.polarity === 1 ? 'positive' : 'negative'}</Code>
          </Text>
          <Text>
            Start: <Code>X:{(feature.xs * getUnitsConversion(units) / getUnitsConversion(feature.units)).toFixed(3)}{units} Y:{(feature.ys * getUnitsConversion(units) / getUnitsConversion(feature.units)).toFixed(3)}{units}</Code>
          </Text>
          <Text>
            End: <Code>X:{(feature.xe * getUnitsConversion(units) / getUnitsConversion(feature.units)).toFixed(3)}{units} Y:{(feature.ye * getUnitsConversion(units) / getUnitsConversion(feature.units)).toFixed(3)}{units}</Code>
          </Text>
        </>
      case 'pad':
        return <>
          <CornerIcon>
            <IconCircle />
          </CornerIcon>
          <Text size="lg" fw={700} c='white'>
            Pad
          </Text>
          <Text>
            Layer: <Code>{feature.layer}</Code>
          </Text>
          <Text>
            Index: <Code>{feature.index}</Code>
          </Text>
          <Text>
            Polarity: <Code>{feature.polarity === 1 ? 'positive' : 'negative'}</Code>
          </Text>
          <Text>
            Center: <Code>X:{(feature.x * getUnitsConversion(units) / getUnitsConversion(feature.units)).toFixed(3)}{units} Y:{(feature.y * getUnitsConversion(units) / getUnitsConversion(feature.units)).toFixed(3)}{units}</Code>
          </Text>
          <Text>
            Resize Factor: <Code>{feature.resize_factor}</Code>
          </Text>
          <Text>
            Mirror: <Code>X:{feature.mirror_x === 1 ? 'yes' : 'no'} Y:{feature.mirror_y === 1 ? 'yes' : 'no'}</Code>
          </Text>
          <Text>
            Rotation (cw): <Code>{feature.rotation}&deg;</Code>
          </Text>
        </>
      case 'arc':
        return <>
          <CornerIcon>
            <IconVectorSpline />
          </CornerIcon>
          <Text size="lg" fw={700} c='white'>
            Arc
          </Text>
          <Text>
            Layer: <Code>{feature.layer}</Code>
          </Text>
          <Text>
            Index: <Code>{feature.index}</Code>
          </Text>
          <Text>
            Polarity: <Code>{feature.polarity === 1 ? 'positive' : 'negative'}</Code>
          </Text>
          <Text>
            Start: <Code>X:{(feature.xs * getUnitsConversion(units) / getUnitsConversion(feature.units)).toFixed(3)}{units} Y:{(feature.ys * getUnitsConversion(units) / getUnitsConversion(feature.units)).toFixed(3)}{units}</Code>
          </Text>
          <Text>
            End: <Code>X:{(feature.xe * getUnitsConversion(units) / getUnitsConversion(feature.units)).toFixed(3)}{units} Y:{(feature.ye * getUnitsConversion(units) / getUnitsConversion(feature.units)).toFixed(3)}{units}</Code>
          </Text>
          <Text>
            Center: <Code>X:{(feature.xc * getUnitsConversion(units) / getUnitsConversion(feature.units)).toFixed(3)}{units} Y:{(feature.yc * getUnitsConversion(units) / getUnitsConversion(feature.units)).toFixed(3)}{units}</Code>
          </Text>
          <Text>
            Rotation: <Code>{feature.clockwise === 1 ? 'clockwise' : 'counter clockwise'}</Code>
          </Text>
        </>
      case 'surface':
        return <>
          <CornerIcon>
            <IconPolygon />
          </CornerIcon>
          <Text size="lg" fw={700} c='white'>
            Surface
          </Text>
          <Text>
            Layer: <Code>{feature.layer}</Code>
          </Text>
          <Text>
            Index: <Code>{feature.index}</Code>
          </Text>
          <Text>
            Polarity: <Code>{feature.polarity === 1 ? 'positive' : 'negative'}</Code>
          </Text>
          <Text>
            Islands: <Code>{feature.contours.filter(x => x.poly_type == 1).length}</Code>
          </Text>
          <Text>
            Holes: <Code>{feature.contours.filter(x => x.poly_type == 0).length}</Code>
          </Text>
          <Text>
            Edges: <Code>{feature.contours.map(ctr => ctr.segments.length).reduce((p, c) => p + c, 0) - 1}</Code>
          </Text>
        </>
      case 'polyline':
        return <>
          <CornerIcon>
            <IconShape2 />
          </CornerIcon>
          <Text size="lg" fw={700} c='white'>
            Polyline
          </Text>
          <Text>
            Layer: <Code>{feature.layer}</Code>
          </Text>
          <Text>
            Index: <Code>{feature.index}</Code>
          </Text>
          <Text>
            Polarity: <Code>{feature.polarity === 1 ? 'positive' : 'negative'}</Code>
          </Text>
          <Text>
            Qty Lines: <Code>{feature.lines.length}</Code>
          </Text>
        </>
      default:
        return <>
          <CornerIcon>
            <IconQuestionMark />
          </CornerIcon>
          <Text size="lg" fw={700} c='white'>
            Unknown
          </Text>
        </>
    }
  }


  return (
    <Transition
      mounted={mounted}
      transition="slide-left"
      duration={400}
      exitDuration={400}
      timingFunction="ease"
    >
      {(styles) =>
        <Card
          radius='md'
          withBorder
          style={{
            width: '250px',
            height: 'calc(100vh - 124px)',
            position: 'absolute',
            top: 64,
            right: 10,
            overflowY: 'auto',
            overflowX: 'hidden',
            pointerEvents: 'all',
            ...styles
          }}
          mod={['transparent']}
          padding={4}
        >
          <ScrollArea
            scrollbars="y"
            className={classes.fixtable}
          >
            {features.map((feature, index) =>
              <Card key={index} shadow="sm" padding="sm" radius="sm" withBorder mod={['transparent']}
                style={{
                  paddingBottom: '1px',
                  marginBottom: index == features.length - 1 ? '0px' : '5px',
                  width: '100%',
                }}>
                <ScrollArea
                  scrollbars="x" offsetScrollbars>
                  <Text size="xs" c="dimmed" truncate="end">
                    {getInfo(feature)}
                  </Text>
                </ScrollArea>
              </Card>
            )}
          </ScrollArea>
          <Affix withinPortal={false} position={{ bottom: 5, right: 10 }}>
            <ActionIcon radius='sm' variant='subtle' onClick={() => setMounted(false)}>
              <IconX />
            </ActionIcon>
          </Affix>
        </Card>
      }
    </Transition>
  );
}