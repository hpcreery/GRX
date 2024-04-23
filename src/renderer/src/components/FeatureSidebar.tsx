import { ScrollArea, Transition } from '@mantine/core';
import { Card, Text} from '@mantine/core';
import { RenderEngine } from '@src/renderer';
import { useEffect, useState } from 'react';
import { PointerEvents } from '@src/renderer';
import { Shape } from '@src/renderer/shapes';
import { NestedFeature } from '@src/renderer/layer';

interface ToolbarProps {
  renderEngine: RenderEngine
}

export function FeatureSidebar({ renderEngine }: ToolbarProps): JSX.Element {
  const [features, setFeatures] = useState<(Shape | NestedFeature)[]>([])
  const [mounted, setMounted] = useState<boolean>(false)


  useEffect(() => {
    renderEngine.pointer.addEventListener(PointerEvents.POINTER_SELECT, (e) => {
      console.log('feature clicked', (e as CustomEvent<(Shape | NestedFeature)[]>).detail)
      const featuresTemp = (e as CustomEvent<(Shape | NestedFeature)[]>).detail
      if (featuresTemp.length > 0) {
        setMounted(true)
        setFeatures((e as CustomEvent<(Shape | NestedFeature)[]>).detail)
      } else {
        setMounted(false)
      }
    })
  }, [])

  return (
    <Transition
      mounted={mounted}
      transition="slide-left"
      duration={400}
      exitDuration={400}
      timingFunction="ease"
    >
      {(styles) => <div 
      className='fade-out-scroll'
      style={{
        width: '250px',
        height: 'calc(100vh - 110px)',
        position: 'absolute',
        top: 55,
        right: 10,
        pointerEvents: 'all',
        ...styles
      }}>
        <ScrollArea h={'calc(100vh - 110px)'} style={{

        }}>
        {features.map((feature, index) => 
          <Card key={index} shadow="sm" padding="lg" radius="md" withBorder mod={['transparent']} 
          style={{
            marginTop: '5px',
            marginBottom: '5px',
          }}>
            <Text size="sm" c="dimmed">
              {JSON.stringify(feature, null, 2)}
            </Text>
          </Card>
        )}
        </ScrollArea>
      </div>}
    </Transition>
  );
}