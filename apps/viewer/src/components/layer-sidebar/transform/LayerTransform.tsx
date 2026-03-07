import { closestCenter, DndContext, type DragEndEvent, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core"
import { restrictToParentElement, restrictToVerticalAxis } from "@dnd-kit/modifiers"
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { type transform, type types, utils } from "@grx/engine"
import { Button, Group, Input, Modal, NumberInput, Paper, Space, Stack, Switch } from "@mantine/core"
import { EditorConfigProvider } from "@src/contexts/EditorContext"
import { IconGripHorizontal } from "@tabler/icons-react"
import { vec2 } from "gl-matrix"
import { type JSX, useContext, useEffect, useState } from "react"

export interface LayerTransformProps {
  layerID: string
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
  const [mirror_x, setMirrorX] = useState<types.Binary>(0)
  /**
   * Mirror y cooriinate values => y = -y
   */
  const [mirror_y, setMirrorY] = useState<types.Binary>(0)

  const [transformOrder, setTransformOrder] = useState<transform.TransformOrder>(["translate", "rotate", "mirror", "scale"])

  const { units, renderer } = useContext(EditorConfigProvider)
  const [layerName, setLayerName] = useState<string>("")

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  function handleDragEnd(event: DragEndEvent): void {
    const { active, over } = event
    if (over == null) {
      return
    }
    if (active.id !== over.id) {
      setTransformOrder((items) => {
        const oldIndex = items.indexOf(active.id as "scale" | "rotate" | "translate" | "mirror")
        const newIndex = items.indexOf(over.id as "scale" | "rotate" | "translate" | "mirror")

        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }

  async function getLayerTransform(): Promise<void> {
    const transform = await renderer.engine.interface.read_view_layer_transform("main", props.layerID)
    setLayerName(props.layerID)
    setDatumX(transform.datum[0])
    setDatumY(transform.datum[1])
    setRotation(transform.rotation)
    setScale(transform.scale)
    setMirrorX(transform.mirror_x)
    setMirrorY(transform.mirror_y)
    if (transform.order != undefined) {
      setTransformOrder(transform.order)
    } else {
      setTransformOrder(["translate", "rotate", "mirror", "scale"])
    }
  }

  async function setLayerTransform(): Promise<void> {
    await renderer.engine.interface.update_view_layer_transform("main", props.layerID, {
      datum: vec2.fromValues(datumX, datumY),
      rotation: rotation,
      scale: scale,
      mirror_x: mirror_x,
      mirror_y: mirror_y,
      order: transformOrder,
    })
    await renderer.engine.render()
  }

  useEffect(() => {
    getLayerTransform()
  }, [])

  useEffect(() => {
    setLayerTransform()
  })

  const roundToThree = (num: number): number => {
    return Number(`${Math.round(Number(`${num}e+5`))}e-5`)
  }

  return (
    <Modal opened={props.visible} onClose={props.onClose} title={`Transform: ${layerName}`}>
      <Group justify="center" wrap="nowrap" grow>
        <NumberInput
          label={`Datum X (${units})`}
          description="Layer X translation"
          placeholder="Input number"
          value={roundToThree(datumX * utils.baseUnitsConversionFactor(units))}
          step={1}
          onChange={(x) => setDatumX(roundToThree(Number(x) / utils.baseUnitsConversionFactor(units)))}
        />
        <NumberInput
          label={`Datum Y (${units})`}
          description="Layer Y translation"
          placeholder="Input number"
          value={roundToThree(datumY * utils.baseUnitsConversionFactor(units))}
          step={1}
          onChange={(y) => setDatumY(roundToThree(Number(y) / utils.baseUnitsConversionFactor(units)))}
        />
      </Group>
      <Space h="md" />
      <NumberInput
        label="Rotation"
        description="Layer rotation in degrees, counterclockwise"
        placeholder="Input number"
        value={rotation}
        onChange={(r) => setRotation(Number(r))}
      />
      <Space h="md" />
      <NumberInput
        label="Scale"
        description="Layer scale factor, 1 = 100% (no scaling)"
        placeholder="Input number"
        value={scale}
        onChange={(s) => setScale(Number(s))}
      />
      <Space h="md" />
      <Group mt={10} justify="center" wrap="nowrap" grow>
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
        <Paper shadow="md" radius="md" withBorder p={4}>
          <Stack align="stretch" justify="center" gap={4}>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
              modifiers={[restrictToVerticalAxis, restrictToParentElement]}
            >
              <SortableContext items={transformOrder} strategy={verticalListSortingStrategy}>
                {transformOrder.map((id) => (
                  <SortableItem key={id} id={id} />
                ))}
              </SortableContext>
            </DndContext>
          </Stack>
        </Paper>
      </Input.Wrapper>
    </Modal>
  )
}

interface SortableItemProps {
  id: string
}

export function SortableItem(props: SortableItemProps): JSX.Element {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: props.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <Button
      justify="space-between"
      rightSection={<IconGripHorizontal size={14} />}
      fullWidth
      variant="default"
      ref={setNodeRef}
      style={style}
      radius="sm"
      {...attributes}
      {...listeners}
    >
      {props.id.toUpperCase()}
    </Button>
  )
}
