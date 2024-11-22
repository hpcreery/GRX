import { useState, useEffect, useContext } from "react"
import { Button, Popover, ColorPicker, useMantineTheme, Tooltip, useMantineColorScheme } from "@mantine/core"
import { notifications } from "@mantine/notifications"
import chroma from "chroma-js"
import { useGesture } from "@use-gesture/react"
import { animated, SpringValue, useSpring } from "@react-spring/web"
import { UploadFile } from "./LayersSidebar"
import {
  IconCircleFilled,
  IconCircleDotted,
  IconTrashX,
  IconPerspective,
  IconEye,
  IconEyeOff,
  IconColorPicker,
  IconContrastOff,
  IconContrast,
  IconClearAll,
  IconGripVertical,
} from "@tabler/icons-react"
import { ContextMenuContent, ShowContextMenuFunction, useContextMenu } from "mantine-contextmenu"
import type { LayerInfo } from "@src/renderer/engine"
import { vec3 } from "gl-matrix"
import LayerTransform from "./transform/LayerTransform"
import { EditorConfigProvider } from "@src/contexts/EditorContext"

import { CSS } from "@dnd-kit/utilities"
import { useSortable } from "@dnd-kit/sortable"
import { ReactDOMAttributes } from "@use-gesture/react/dist/declarations/src/types"

interface LayerListItemProps {
  file: UploadFile
  actions: {
    download: () => void
    preview: () => void
    remove: (file: UploadFile) => Promise<void>
    hideAll: () => void
    showAll: () => void
    deleteAll: () => void
  }
}

export default function LayerListItem(props: LayerListItemProps): JSX.Element | null {
  const { renderEngine } = useContext(EditorConfigProvider)
  const { showContextMenu } = useContextMenu()
  const { file, actions } = props
  const [{ width }, api] = useSpring(() => ({ x: 0, y: 0, width: 0 }))
  const [color, setColor] = useState<vec3>(vec3.fromValues(0.5, 0.5, 0.5))
  const [colorPickerVisible, setColorPickerVisible] = useState<boolean>(false)
  const [layerTransformVisible, setLayerTransformVisible] = useState<boolean>(false)

  async function changeColor(color: vec3): Promise<void> {
    const renderer = await renderEngine.backend
    if (!renderer) return
    await renderer.setLayerProps(file.id, { color })
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
      <Popover.Target>
        <DraggableLayer
          actions={actions}
          setLayerTransformVisible={setLayerTransformVisible}
          showContextMenu={showContextMenu}
          file={file}
          bind={bind}
          setColor={setColor}
          color={color}
          setColorPickerVisible={setColorPickerVisible}
          colorPickerVisible={colorPickerVisible}
          width={width}
        />
      </Popover.Target>
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
      <LayerTransform layerID={file.id} visible={layerTransformVisible} onClose={() => setLayerTransformVisible(false)} />
    </Popover>
  )
}

interface DraggableLayerProps {
  showContextMenu: ShowContextMenuFunction
  file: UploadFile
  bind: () => ReactDOMAttributes
  color: vec3
  setColor: (color: vec3) => void
  setColorPickerVisible: (show: boolean) => void
  colorPickerVisible: boolean
  width: SpringValue<number>
  setLayerTransformVisible: (visible: boolean) => void
  actions: {
    download: () => void
    preview: () => void
    remove: (file: UploadFile) => Promise<void>
    hideAll: () => void
    showAll: () => void
    deleteAll: () => void
  }
}

function DraggableLayer(props: DraggableLayerProps): JSX.Element {
  const { showContextMenu, file, bind, setColorPickerVisible: setShowColorPicker, color, setColor, colorPickerVisible: showColorPicker, width, setLayerTransformVisible, actions } = props
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: props.file.id })
  const theme = useMantineTheme()
  const colors = useMantineColorScheme()
  const [visible, setVisible] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(true)
  const { renderEngine } = useContext(EditorConfigProvider)

  function deleteLayer(): void {
    actions.remove(file)
  }

  async function toggleVisible(): Promise<void> {
    const renderer = await renderEngine.backend
    if (!renderer) return
    if (visible) {
      renderer.setLayerProps(file.id, { visible: false })
      setVisible(false)
    } else {
      renderer.setLayerProps(file.id, { visible: true })
      setVisible(true)
    }
  }

  const items: ContextMenuContent = [
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

  function registerLayers(rendererLayers: LayerInfo[]): void {
    const thisLayer = rendererLayers.find((l) => l.id === file.id)
    if (thisLayer) {
      setColor(thisLayer.color)
      setVisible(thisLayer.visible)
      // setzIndex(thisLayer.zIndex)
      setLoading(false)
    }
  }

  useEffect(() => {
    renderEngine.backend.then(async (renderer) => {
      const layers = await renderer.getLayers()
      registerLayers(layers)
      if (layers.find((l) => l.id === file.id)) {
        setLoading(false)
        return
      }

      const reader = new FileReader()
      reader.onerror = (err): void => {
        console.log(err, `${file.name} Error reading file.`)
        notifications.show({
          title: "Error reading file",
          message: `${file.name} Error reading file.`,
          color: "red",
          autoClose: 5000,
        })
      }
      reader.onabort = (err): void => {
        console.log(err, `${file.name} File read aborted.`)
        notifications.show({
          title: "File read aborted",
          message: `${file.name} File read aborted.`,
          color: "red",
          autoClose: 5000,
        })
      }
      reader.onprogress = (e): void => {
        const percent = Math.round((e.loaded / e.total) * 100)
        console.log(`${file.name} ${percent}% read`)
      }
      reader.onload = async (_e): Promise<void> => {
        if (reader.result !== null && reader.result !== undefined) {
          try {
            await renderer.addFile({
              format: file.format,
              buffer: reader.result as ArrayBuffer,
              props: {
                name: file.name,
                // id: file.id
              },
            })
            // notifications.show({
            //   title: 'File read',
            //   message: `${file.name} file read.`,
            //   color: 'green',
            //   autoClose: 5000
            // })
          } catch (fileParseError) {
            console.error(fileParseError)
            notifications.show({
              title: "File parse error",
              message: `${file.name} file parse error.`,
              color: "red",
              autoClose: 5000,
            })
          }
          registerLayers(await renderer.getLayers())
        } else {
          notifications.show({
            title: "File upload failed",
            message: `${file.name} file upload failed.`,
            color: "red",
            autoClose: 5000,
          })
        }
      }
      reader.readAsArrayBuffer(file)
    })

    return (): void => {}
  }, [])

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
      <animated.div {...bind()} style={{ width: "100%", overflow: "hidden", touchAction: "none", overscrollBehaviorX: "none" }}>
        <Tooltip label={file.name} withArrow openDelay={1000} transitionProps={{ transition: "slide-up", duration: 300 }}>
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
            loading={loading}
          >
            {file.name}
          </Button>
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
    </div>
  )
}
