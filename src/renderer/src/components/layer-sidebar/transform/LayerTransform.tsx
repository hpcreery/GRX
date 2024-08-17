import { useState, useEffect, useContext } from 'react'
import { Group, Modal, NumberInput, Switch, Space, Button, Stack, Paper, Input } from '@mantine/core'
import { Binary, TransformOrder, Units } from '@src/renderer/types'
import { RenderEngine } from '@src/renderer'
import type { LayerInfo } from '@src/renderer/engine'
import { vec2 } from 'gl-matrix'
import { ConfigEditorProvider } from '@src/contexts/ConfigEditor';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { IconGripHorizontal } from '@tabler/icons-react'
import { getUnitsConversion } from '@src/renderer/utils'

export interface LayerTransformProps {
  renderEngine: RenderEngine
  layersUID: string
  visible: boolean
  onClose: () => void
}

export default function LayerTransform(props: LayerTransformProps): JSX.Element {
  /**
   * Translation in x and y
   */
  const [datumX, setDatumX] = useState<number>(0)
  const [datumY, setDatumY] = useState<number>(0)
  /**
   * Rotation in degrees (counter clockwise)
   */
  const [rotation, setRotation] = useState<number>(0)
  /**
   * Scale factor, 1 = 100% (no scaling)
   */
  const [scale, setScale] = useState<number>(1)
  /**
   * Mirror x cooriinate values => x = -x
   */
  const [mirror_x, setMirrorX] = useState<Binary>(0)
  /**
   * Mirror y cooriinate values => y = -y
   */
  const [mirror_y, setMirrorY] = useState<Binary>(0)

  const [transformOrder, setTransformOrder] = useState<TransformOrder>(['translate', 'rotate', 'mirror', 'scale'])


  const { units } = useContext(ConfigEditorProvider)
  const [layerUnits, setLayerUnts] = useState<Units>(units)
  const [layerName, setLayerName] = useState<string>('')

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event): void {
    const { active, over } = event;

    if (active.id !== over.id) {
      setTransformOrder((items) => {
        const oldIndex = items.indexOf(active.id);
        const newIndex = items.indexOf(over.id);

        return arrayMove(items, oldIndex, newIndex);
      });
    }
  }

  useEffect(() => {
    props.renderEngine.backend.then((backend) => {
      backend.getLayers().then((layers: LayerInfo[]) => {
        layers.forEach((layer: LayerInfo) => {
          if (layer.uid === props.layersUID) {
            setLayerName(layer.name)
            setLayerUnts(layer.units)
            setDatumX(layer.transform.datum[0])
            setDatumY(layer.transform.datum[1])
            setRotation(layer.transform.rotation)
            setScale(layer.transform.scale)
            setMirrorX(layer.transform.mirror_x)
            setMirrorY(layer.transform.mirror_y)
            if (layer.transform.order != undefined) {
              setTransformOrder(layer.transform.order)
            } else {
              setTransformOrder(['translate', 'rotate', 'mirror', 'scale'])
            }
          }
        })
      })
    })
    return (): void => {
      console.log('LayerTransform Unloaded')
    }
  }, [])

  useEffect(() => {
    props.renderEngine.backend.then((backend) => {
      backend.getLayers().then((layers: LayerInfo[]) => {
        layers.forEach((layer: LayerInfo) => {
          if (layer.uid === props.layersUID) {
            backend.setLayerTransform(layer.uid, {
              datum: vec2.fromValues(datumX, datumY),
              rotation: rotation,
              scale: scale,
              mirror_x: mirror_x,
              mirror_y: mirror_y,
              order: transformOrder
            })
          }
        })
      })
    })
  })


  return (
    <Modal
      opened={props.visible}
      onClose={props.onClose}
      title={`Transform: ${layerName}`}
    >
      <Group justify="center" wrap='nowrap' grow>
        <NumberInput
          label={`Datum X (${units})`}
          description="Layer X translation"
          placeholder="Input number"
          value={Number((datumX * getUnitsConversion(units) / getUnitsConversion(layerUnits)).toFixed(2))}
          step={getUnitsConversion(layerUnits)}
          onChange={x => setDatumX(Number((Number(x) * getUnitsConversion(layerUnits) / getUnitsConversion(units)).toFixed(2)))}
        />
        <NumberInput
          label={`Datum Y (${units})`}
          description="Layer Y translation"
          placeholder="Input number"
          value={Number((datumY * getUnitsConversion(units) / getUnitsConversion(layerUnits)).toFixed(2))}
          step={getUnitsConversion(layerUnits)}
          onChange={y => setDatumY(Number((Number(y) * getUnitsConversion(layerUnits) / getUnitsConversion(units)).toFixed(2)))}
        />
      </Group>
      <Space h="md" />
      <NumberInput
        label="Rotation"
        description="Layer rotation in degrees, counterclockwise"
        placeholder="Input number"
        value={rotation}
        onChange={r => setRotation(Number(r))}
      />
      <Space h="md" />
      <NumberInput
        label="Scale"
        description="Layer scale factor, 1 = 100% (no scaling)"
        placeholder="Input number"
        value={scale}
        onChange={s => setScale(Number(s))}
      />
      <Space h="md" />
      <Group mt={10} justify="center" wrap='nowrap' grow>
        <Switch
          label="Mirror X"
          description="Mirror X cooriinate values => x = -x"
          checked={mirror_x === 1}
          onChange={() => setMirrorX(mirror_x === 0 ? 1 : 0)}
        />
        <Switch
          label="Mirror Y"
          description="Mirror Y cooriinate values => y = -y"
          checked={mirror_y === 1}
          onChange={() => setMirrorY(mirror_y === 0 ? 1 : 0)}
        />
      </Group>
      <Space h="md" />
      <Input.Wrapper label="Order of Transormations" description="Drag and drop operations. Performed in order from top to bottom.">
        <Space h="xs" />
        <Paper shadow="md" radius="lg" p="xs" withBorder>
          <Stack
            align="stretch"
            justify="center"
            gap="xs"
          >
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={transformOrder}
                strategy={verticalListSortingStrategy}
              >
                {transformOrder.map(id => <SortableItem key={id} id={id} />)}
              </SortableContext>
            </DndContext>
          </Stack>
        </Paper>
      </Input.Wrapper>
    </Modal>
  )
}

interface SortableItemProps {
  id: string;
}

export function SortableItem(props: SortableItemProps): JSX.Element {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: props.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <Button justify="space-between" rightSection={<IconGripHorizontal size={14} />} fullWidth variant="default" ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {props.id.toUpperCase()}
    </Button>
  );
}
