import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Button, ColorPicker, Input, Popover, Tooltip, useMantineColorScheme, useMantineTheme } from "@mantine/core"
import { animated, type SpringValue, useSpring } from "@react-spring/web"
import { EditorConfigProvider } from "@src/contexts/EditorContext"
import {
  IconCheck,
  IconCircleDotted,
  IconCircleFilled,
  IconClearAll,
  IconColorPicker,
  IconContrast,
  IconContrastOff,
  IconCursorText,
  IconEye,
  IconEyeOff,
  IconGripVertical,
  IconPerspective,
  IconTrashX,
} from "@tabler/icons-react"
import { useGesture } from "@use-gesture/react"
import type { ReactDOMAttributes } from "@use-gesture/react/dist/declarations/src/types"
import chroma from "chroma-js"
import { vec3 } from "gl-matrix"
import { type ContextMenuContent, type ShowContextMenuFunction, useContextMenu } from "mantine-contextmenu"
import { type JSX, useContext, useEffect, useState } from "react"
import LayerTransform from "./transform/LayerTransform"

interface LayerActions {
  download: () => void
  preview: () => void
  remove: (layer: string) => Promise<void>
  hideAll: () => void
  showAll: () => void
  deleteAll: () => void
  rename: (oldName: string, newName: string) => Promise<void>
}

interface LayerListItemProps {
  layer: string
  actions: LayerActions
}

export default function LayerListItem(props: LayerListItemProps): JSX.Element | null {
  const { renderer } = useContext(EditorConfigProvider)
  const { showContextMenu } = useContextMenu()
  // const { file, actions } = props
  const { actions, layer } = props
  const [{ width }, api] = useSpring(() => ({ x: 0, y: 0, width: 0 }))
  const [color, setColor] = useState<vec3>(vec3.fromValues(0.5, 0.5, 0.5))
  const [colorPickerVisible, setColorPickerVisible] = useState<boolean>(false)
  const [layerTransformVisible, setLayerTransformVisible] = useState<boolean>(false)

  async function changeColor(color: vec3): Promise<void> {
    const engine = await renderer.engine
    if (!engine) return
    await engine.interface.update_view_layer_color("main", layer, color)
    setColor(color)
  }

  let lastx = 0
  const bind = useGesture(
    {
      onDrag: ({ down, offset: [mx, my], event }) => {
        event.stopPropagation()
        if (down) {
          api.start({ x: mx, y: my, width: -mx })
          lastx = mx
        } else {
          api.start({ x: lastx < -20 ? -50 : 0, y: 0, width: lastx < -20 ? 50 : 0 })
        }
      },
      onWheel: ({ offset: [mx, my] }) => {
        api.start({ x: -mx, y: my, width: mx })
      },
    },
    {
      drag: {
        axis: "x",
        bounds: { left: -50, right: 1, top: 0, bottom: 0 },
        filterTaps: true,
      },
      wheel: {
        axis: "x",
        bounds: { left: 0, right: 50, top: 0, bottom: 0 },
      },
    },
  )

  return (
    <Popover position="right" withArrow trapFocus shadow="md" opened={colorPickerVisible} onChange={setColorPickerVisible}>
      <DraggableLayer
        key={layer}
        actions={actions}
        setLayerTransformVisible={setLayerTransformVisible}
        showContextMenu={showContextMenu}
        layer={layer}
        bind={bind}
        setColor={setColor}
        color={color}
        setColorPickerVisible={setColorPickerVisible}
        colorPickerVisible={colorPickerVisible}
        width={width}
      />
      <Popover.Dropdown
        style={{
          padding: "0.5rem",
        }}
      >
        <ColorPicker
          style={{ width: "100%" }}
          value={chroma.gl(color[0], color[1], color[2]).hex()}
          onChangeEnd={(color): void => {
            const colors = chroma(color).gl()
            changeColor(vec3.fromValues(colors[0], colors[1], colors[2]))
            setColorPickerVisible(false)
          }}
          swatchesPerRow={7}
          format="hex"
          swatches={[
            "#25262b",
            "#868e96",
            "#fa5252",
            "#e64980",
            "#be4bdb",
            "#7950f2",
            "#4c6ef5",
            "#228be6",
            "#15aabf",
            "#12b886",
            "#40c057",
            "#82c91e",
            "#fab005",
            "#fd7e14",
          ]}
        />
      </Popover.Dropdown>
      <LayerTransform layerID={layer} visible={layerTransformVisible} onClose={() => setLayerTransformVisible(false)} />
    </Popover>
  )
}

interface DraggableLayerProps {
  showContextMenu: ShowContextMenuFunction
  layer: string
  bind: () => ReactDOMAttributes
  color: vec3
  setColor: (color: vec3) => void
  setColorPickerVisible: (show: boolean) => void
  colorPickerVisible: boolean
  width: SpringValue<number>
  setLayerTransformVisible: (visible: boolean) => void
  actions: LayerActions
}

function DraggableLayer(props: DraggableLayerProps): JSX.Element {
  const {
    showContextMenu,
    layer,
    bind,
    setColorPickerVisible: setShowColorPicker,
    color,
    setColor,
    colorPickerVisible: showColorPicker,
    width,
    setLayerTransformVisible,
    actions,
  } = props
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: props.layer })
  const theme = useMantineTheme()
  const colors = useMantineColorScheme()
  const [visible, setVisible] = useState<boolean>(false)
  const { renderer } = useContext(EditorConfigProvider)
  const [editing, setEditing] = useState<string | undefined>(undefined)
  const [renameError, setRenameError] = useState<boolean>(false)

  function deleteLayer(): void {
    actions.remove(layer)
  }

  async function toggleVisible(): Promise<void> {
    const engine = await renderer.engine
    if (!engine) return
    if (visible) {
      engine.interface.update_view_layer_visibility("main", layer, false)
      setVisible(false)
    } else {
      engine.interface.update_view_layer_visibility("main", layer, true)
      setVisible(true)
    }
  }

  const items: ContextMenuContent = [
    {
      title: "Rename Layer",
      key: "0",
      icon: <IconCursorText stroke={1.5} size={18} />,
      onClick: (): void => {
        setEditing(layer)
      },
    },
    {
      title: "Change Color",
      key: "1",
      icon: <IconColorPicker stroke={1.5} size={18} />,
      onClick: (): void => {
        setTimeout(() => {
          setShowColorPicker(true)
        }, 100)
      },
    },
    {
      title: "Transform",
      key: "7",
      icon: <IconPerspective stroke={1.5} size={18} />,
      onClick: (): void => {
        setLayerTransformVisible(true)
      },
    },
    {
      title: visible ? "Hide Layer" : "Show Layer",
      key: "2",
      icon: visible ? <IconEyeOff stroke={1.5} size={18} /> : <IconEye stroke={1.5} size={18} />,
      onClick: toggleVisible,
    },
    // {
    //   title: 'Features Histogram',
    //   key: '4',
    //   icon: <IconChartHistogram stroke={1.5} size={18} />,
    //   onClick: (): void => {
    //     featureHistogramModalRef.current?.open()
    //   },
    //   disabled: true
    // },
    {
      key: "divider",
    },
    {
      title: "Hide All Layers",
      key: "3",
      icon: <IconContrastOff stroke={1.5} size={18} />,
      onClick: actions.hideAll,
    },
    {
      title: "Show All Layers",
      key: "4",
      icon: <IconContrast stroke={1.5} size={18} />,
      onClick: actions.showAll,
    },
    {
      key: "divider2",
    },
    {
      title: "Delete Layer",
      key: "5",
      icon: <IconTrashX stroke={1.5} size={18} style={{ color: theme.colors.red[7] }} />,
      onClick: deleteLayer,
    },
    {
      title: "Delete All Layers",
      key: "6",
      icon: <IconClearAll stroke={1.5} size={18} style={{ color: theme.colors.red[7] }} />,
      onClick: actions.deleteAll,
    },
  ]

  async function getLayerColor(): Promise<void> {
    const newColor = await renderer.engine.interface.read_view_layer_color("main", layer)
    if (newColor[0] !== color[0] || newColor[1] !== color[1] || newColor[2] !== color[2]) {
      setColor(newColor)
    }
  }

  async function getLayerVisibility(): Promise<void> {
    const newVisible = await renderer.engine.interface.read_view_layer_visibility("main", layer)
    if (newVisible !== visible) {
      setVisible(newVisible)
    }
  }

  useEffect(() => {
    getLayerColor()
    getLayerVisibility()

    return (): void => {}
  })

  const rename = (): void => {
    if (editing === "") {
      setEditing(undefined)
      return
    }
    actions
      .rename(layer, editing!)
      .then(() => {
        setEditing(undefined)
      })
      .catch(() => {
        setRenameError(true)
      })
  }

  return (
    <div
      onContextMenu={showContextMenu(items)}
      style={{
        display: "flex",
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      ref={setNodeRef}
    >
      {editing != undefined ? (
        <Input
          style={{
            textAlign: "left",
            width: "100%",
            overflow: "hidden",
            overscrollBehaviorX: "none",
            padding: 0,
            paddingLeft: 0,
          }}
          autoFocus
          error={renameError}
          radius="sm"
          value={editing}
          placeholder={layer}
          onBlur={rename}
          onChange={(e): void => setEditing(e.target.value)}
          onKeyDown={(e): void => {
            if (e.key === "Enter") {
              rename()
            } else if (e.key === "Escape") {
              setEditing(undefined)
            }
          }}
          rightSectionPointerEvents="auto"
          rightSection={<IconCheck aria-label="Accept" onClick={rename} style={{ display: editing ? undefined : "none", cursor: "pointer" }} />}
        />
      ) : (
        <>
          <animated.div {...bind()} style={{ width: "100%", overflow: "hidden", touchAction: "none", overscrollBehaviorX: "none" }}>
            <Tooltip label={layer} withArrow openDelay={1000} transitionProps={{ transition: "slide-up", duration: 300 }}>
              <Popover.Target>
                <Button
                  style={{
                    textAlign: "left",
                    width: "100%",
                    overflow: "hidden",
                    overscrollBehaviorX: "none",
                    padding: 0,
                    paddingLeft: 0,
                  }}
                  variant="default"
                  color={colors.colorScheme === "dark" ? theme.colors.gray[1] : theme.colors.gray[9]}
                  radius="sm"
                  leftSection={
                    <>
                      <IconGripVertical size={14} {...attributes} {...listeners} />
                      {visible ? (
                        <IconCircleFilled
                          size={18}
                          style={{
                            color: chroma.gl(color[0], color[1], color[2]).hex(),
                          }}
                          onClick={(e): void => {
                            e.stopPropagation()
                            setShowColorPicker(!showColorPicker)
                          }}
                        />
                      ) : (
                        <IconCircleDotted
                          size={18}
                          style={{
                            color: chroma.gl(color[0], color[1], color[2]).hex(),
                          }}
                          onClick={(e): void => {
                            e.stopPropagation()
                            setShowColorPicker(!showColorPicker)
                          }}
                        />
                      )}
                    </>
                  }
                  justify="flex-start"
                  onClick={(): void => {
                    toggleVisible()
                  }}
                  // loading={loading}
                >
                  {layer}
                </Button>
              </Popover.Target>
            </Tooltip>
          </animated.div>
          <animated.div {...bind()} style={{ width }}>
            <Button
              radius="sm"
              style={{ padding: 0, width: `calc(100% - 4px)`, overflow: "hidden", marginLeft: 4 }}
              leftSection={<IconTrashX style={{ color: theme.colors.red[7] }} stroke={1.5} size={18} />}
              onClick={deleteLayer}
              variant="default"
              color="gray"
              styles={{
                section: {
                  margin: 0,
                },
              }}
            />
          </animated.div>
        </>
      )}
    </div>
  )
}
