import { ActionIcon, Affix, Avatar, Button, Code, Paper, ScrollArea, ThemeIcon, Transition } from '@mantine/core';
import { Card, Text } from '@mantine/core';
import { RenderEngine } from '@src/renderer';
import { useEffect, useState, useContext } from 'react';
import { PointerEvents } from '@src/renderer';
import { Shape } from '@src/renderer/shapes';
import {
  IconCircle,
  IconCircleFilled,
  IconLine,
  IconVectorSpline,
  IconPolygon,
  IconShape2,
  IconQuestionMark,
  IconX
} from '@tabler/icons-react'
import { ConfigEditorProvider } from '@src/contexts/ConfigEditor';

interface ToolbarProps {
  renderEngine: RenderEngine
}

export function FeatureSidebar({ renderEngine }: ToolbarProps): JSX.Element {
  const { primaryColor } = useContext(ConfigEditorProvider)
  const [features, setFeatures] = useState<Shape[]>([])
  const [mounted, setMounted] = useState<boolean>(false)


  useEffect(() => {
    const handler = (e): void => {
      console.log('feature clicked', (e as CustomEvent<Shape[]>).detail)
      const featuresTemp = (e as CustomEvent<Shape[]>).detail
      if (featuresTemp.length > 0) {
        setMounted(true)
        setFeatures((e as CustomEvent<Shape[]>).detail)
      } else {
        setMounted(false)
      }
    }
    renderEngine.pointer.addEventListener(PointerEvents.POINTER_SELECT, handler)
    return () => {
      renderEngine.pointer.removeEventListener(PointerEvents.POINTER_SELECT, handler)
    }
  }, [])

  const getInfo = (feature: Shape): JSX.Element => {
    switch (feature.type) {
      case 'line':
        return <>
          <ThemeIcon size='md' variant="outline" radius="md" style={{
            position: 'absolute',
            right: '20px',
          }}>
            <IconLine />
          </ThemeIcon>
          <Text size="lg" fw={700}>
            Line
          </Text>
          <Text>
            Index: <Code>{feature.index}</Code>
          </Text>
          <Text>
            Polarity: <Code>{feature.polarity === 1 ? 'positive' : 'negative'}</Code>
          </Text>
          <Text>
            Start: <Code>X:{feature.xs} Y:{feature.ys}</Code> 
          </Text>
          <Text>
            End: <Code>X:{feature.xe} Y:{feature.ye}</Code>
          </Text>
        </>
      case 'pad':
        return <>
          <ThemeIcon size='md' variant="outline" radius="md" style={{
            position: 'absolute',
            right: '20px',
          }}>
            <IconCircleFilled />
          </ThemeIcon>
          <Text size="lg" fw={700}>
            Pad
          </Text>
          <Text>
            Index: <Code>{feature.index}</Code>
          </Text>
          <Text>
            Polarity: <Code>{feature.polarity === 1 ? 'positive' : 'negative'}</Code>
          </Text>
          <Text>
            Center: <Code>X:{feature.x} Y:{feature.y}</Code>
          </Text>
          <Text>
            Resize Factor: <Code>{feature.resize_factor}</Code>
          </Text>
          <Text>
            Mirror: <Code>X:{feature.mirror_x === 1 ? 'yes' : 'no'} Y:{feature.mirror_y === 1 ? 'yes' : 'no'}</Code>
          </Text>
          <Text>
            Rotation (cw): <Code>{feature.rotation}</Code>
          </Text>
        </>
      case 'arc':
        return <>
          <ThemeIcon size='md' variant="outline" radius="md" style={{
            position: 'absolute',
            right: '20px',
          }}>
            <IconVectorSpline />
          </ThemeIcon>
          <Text size="lg" fw={700}>
            Arc
          </Text>
          <Text>
            Index: <Code>{feature.index}</Code>
          </Text>
          <Text>
            Polarity: <Code>{feature.polarity === 1 ? 'positive' : 'negative'}</Code>
          </Text>
          <Text>
            Start: <Code>X:{feature.xs} Y:{feature.ys}</Code>
          </Text>
          <Text>
            End: <Code>X:{feature.xe} Y:{feature.ye}</Code>
          </Text>
          <Text>
            Center: <Code>X:{feature.xc} Y:{feature.yc}</Code>
          </Text>
          <Text>
            Rotation: <Code>{feature.clockwise === 1 ? 'clockwise' : 'counter clockwise'}</Code>
          </Text>
        </>
      case 'surface':
        return <>
          <ThemeIcon size='md' variant="outline" radius="md" style={{
            position: 'absolute',
            right: '20px',
          }}>
            <IconPolygon />
          </ThemeIcon>
          <Text size="lg" fw={700}>
            Surface
          </Text>
          <Text>
            Index: <Code>{feature.index}</Code>
          </Text>
          <Text>
            Polarity: <Code>{feature.polarity === 1 ? 'positive' : 'negative'}</Code>
          </Text>
          <Text>
            Qty Islands: <Code>{feature.contours.filter(x => x.poly_type == 1).length}</Code>
          </Text>
          <Text>
            Qty Holes: <Code>{feature.contours.filter(x => x.poly_type == 0).length}</Code>
          </Text>
          <Text>
            Qty Edges: <Code>{feature.contours.map(ctr => ctr.segments.length).reduce((p, c) => p + c, 0) - 1}</Code>
          </Text>
        </>
      case 'polyline':
        return <>
          <ThemeIcon size='md' variant="outline" radius="md" style={{
            position: 'absolute',
            right: '20px',
          }}>
            <IconShape2 />
          </ThemeIcon>
          <Text size="lg" fw={700}>
            Polyline
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
          <ThemeIcon size='md' variant="outline" radius="md" style={{
            position: 'absolute',
            right: '20px',
          }}>
            <IconQuestionMark />
          </ThemeIcon>
          <Text size="lg" fw={700}>
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
            height: 'calc(100vh - 126px)',
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
          >
            {features.map((feature, index) =>
              <Card key={index} shadow="sm" padding="lg" radius="sm" withBorder mod={['transparent']}
                style={{
                  marginBottom: '5px',
                }}>
                <Text size="sm" c="dimmed">
                  {getInfo(feature)}
                </Text>
              </Card>
            )}
          </ScrollArea>
          <Affix withinPortal={false} position={{ bottom: 5, right: 10 }}>
            <ActionIcon radius='sm' variant='subtle' onClick={() => setMounted(false)}>
              <IconX/>
            </ActionIcon>
          </Affix>
        </Card>
      }
    </Transition>
  );
}