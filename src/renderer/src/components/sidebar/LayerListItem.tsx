import { useState, useEffect, useRef } from 'react'
import { Button, Popover, ColorPicker, useMantineTheme, Tooltip } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import chroma from 'chroma-js'
import { ColorSource } from 'pixi.js'
import { useGesture } from '@use-gesture/react'
import { animated, useSpring } from '@react-spring/web'
import { TRendererLayer } from '../../renderer/types'
import VirtualGerberApplication from '../../renderer/virtual'
import * as Comlink from 'comlink'
import FeatureHistogramModal, { FeatureHistogramModalRef } from '../histogram/FeatureHistogramModal'
import { UploadFile } from '../LayersSidebar'
import {
  IconCircleFilled,
  IconCircleDotted,
  IconTrashX,
  IconChartHistogram,
  IconEye,
  IconEyeOff,
  IconColorPicker
} from '@tabler/icons-react'
import { useContextMenu } from 'mantine-contextmenu'

interface LayerListItemProps {
  file: UploadFile
  gerberApp: VirtualGerberApplication
  actions: {
    download: () => void
    preview: () => void
    remove: (file: UploadFile) => void
  }
}

export default function LayerListItem(props: LayerListItemProps): JSX.Element | null {
  const showContextMenu = useContextMenu()
  const theme = useMantineTheme()
  const { gerberApp, file, actions } = props
  const layer: Pick<TRendererLayer, 'name' | 'uid'> = {
    name: file.name,
    uid: file.uid
  }
  const [{ width }, api] = useSpring(() => ({ x: 0, y: 0, width: 0 }))
  const [color, setColor] = useState<ColorSource>(0x000000)
  const [visible, setVisible] = useState<boolean>(false)
  // const [zIndex, setzIndex] = useState<number>(layer.zIndex)
  // const [progress, setProgress] = useState<number>(0)
  const [loading, setLoading] = useState<boolean>(true)
  const [showColorPicker, setShowColorPicker] = useState<boolean>(false)
  const featureHistogramModalRef = useRef<FeatureHistogramModalRef>(null)

  function registerLayers(rendererLayers: TRendererLayer[]): void {
    const thisLayer = rendererLayers.find((l) => l.uid === layer.uid)
    if (thisLayer) {
      setColor(thisLayer.color)
      setVisible(thisLayer.visible)
      // setzIndex(thisLayer.zIndex)
      setLoading(false)
    }
  }

  useEffect(() => {
    gerberApp.renderer.then(async (renderer) => {
      const layers = await renderer.layers
      registerLayers(layers)
      renderer.addViewportListener(
        'childAdded',
        Comlink.proxy(async () => {
          registerLayers(await renderer.layers)
        })
      )
      if (layers.find((l) => l.uid === layer.uid)) {
        console.log('layer already exists')
        setLoading(false)
        return
      }

      const reader = new FileReader()
      reader.onerror = (err): void => {
        console.log(err, `${file.name} Error reading file.`)
        notifications.show({
          title: 'Error reading file',
          message: `${file.name} Error reading file.`,
          color: 'red',
          autoClose: 5000
        })
      }
      reader.onabort = (err): void => {
        console.log(err, `${file.name} File read aborted.`)
        notifications.show({
          title: 'File read aborted',
          message: `${file.name} File read aborted.`,
          color: 'red',
          autoClose: 5000
        })
      }
      reader.onprogress = (e): void => {
        const percent = Math.round((e.loaded / e.total) * 100)
        console.log(`${file.name} ${percent}% read`)
      }
      reader.onload = async (e): Promise<void> => {
        if (e.target?.result !== null && e.target?.result !== undefined) {
          await renderer.addGerber(file.name, e.target?.result as string, file.uid)
          notifications.show({
            title: 'File read',
            message: `${file.name} file read.`,
            color: 'green',
            autoClose: 5000
          })
        } else {
          // messageApi.error(`${file.name} file upload failed.`)
        }
      }
      reader.readAsText(file)
    })

    return (): void => {}
  }, [])

  function deleteLayer(): void {
    actions.remove(file)
  }

  async function changeColor(color: ColorSource): Promise<void> {
    const renderer = await gerberApp.renderer
    if (!renderer) return
    await renderer.tintLayer(layer.uid, color)
    setColor(color)
  }

  async function toggleVisible(): Promise<void> {
    // setLoading(!loading)
    const renderer = await gerberApp.renderer
    if (!renderer) return
    if (visible) {
      renderer.hideLayer(layer.uid)
      setVisible(false)
    } else {
      renderer.showLayer(layer.uid)
      setVisible(true)
    }
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
          api.start({ x: lastx < -20 ? -40 : 0, y: 0, width: lastx < -20 ? 40 : 0 })
        }
      },
      onWheel: ({ offset: [mx, my] }) => {
        api.start({ x: -mx, y: my, width: mx })
      }
    },
    {
      drag: {
        axis: 'x',
        bounds: { left: -40, right: 1, top: 0, bottom: 0 },
        filterTaps: true
      },
      wheel: {
        axis: 'x',
        bounds: { left: 0, right: 40, top: 0, bottom: 0 }
      }
    }
  )

  const items = [
    {
      title: 'Change Color',
      key: '1',
      icon: <IconColorPicker stroke={1.5} size={18} />,
      onClick: (): void => {
        setTimeout(() => {
          setShowColorPicker(true)
        }, 100)
      }
    },
    {
      title: visible ? 'Hide Layer' : 'Show Layer',
      key: '3',
      icon: visible ? <IconEyeOff stroke={1.5} size={18} /> : <IconEye stroke={1.5} size={18} />,
      onClick: toggleVisible
    },
    {
      title: 'Features Histogram',
      key: '4',
      icon: <IconChartHistogram stroke={1.5} size={18} />,
      onClick: (): void => {
        featureHistogramModalRef.current?.open()
      }
    },
    {
      key: 'divider'
    },
    {
      title: 'Delete Layer',
      key: '0',
      icon: <IconTrashX stroke={1.5} size={18} style={{ color: theme.colors.red[7] }} />,
      onClick: deleteLayer
    }
  ]

  return (
    <Popover
      width="target"
      position="bottom"
      withArrow
      trapFocus
      shadow="md"
      opened={showColorPicker}
      onChange={setShowColorPicker}
    >
      <Popover.Target>
        <div
          onContextMenu={showContextMenu(items, { className: 'transparency' })}
          style={{
            display: 'flex'
          }}
        >
          <animated.div {...bind()} style={{ width: '100%', overflow: 'hidden' }}>
            <Tooltip
              label={file.name}
              withArrow
              openDelay={1000}
              transitionProps={{ transition: 'slide-up', duration: 300 }}
            >
              <Button
                style={{
                  textAlign: 'left',
                  width: '100%',
                  overflow: 'hidden',
                  padding: 0
                }}
                variant="subtle"
                color="gray"
                styles={(theme) => ({
                  root: {
                    color: theme.colorScheme == 'dark' ? theme.colors.gray[4] : theme.colors.gray[9]
                  },
                  inner: {
                    justifyContent: 'flex-start',
                    paddingLeft: 10
                  }
                })}
                leftIcon={
                  visible ? (
                    <IconCircleFilled
                      size={18}
                      style={{
                        color: chroma(color as any).hex()
                      }}
                      onClick={(e) => {
                        e.stopPropagation()
                        setShowColorPicker(!showColorPicker)
                      }}
                    />
                  ) : (
                    <IconCircleDotted
                      size={18}
                      style={{
                        color: chroma(color as any).hex()
                      }}
                      onClick={(e) => {
                        e.stopPropagation()
                        setShowColorPicker(!showColorPicker)
                      }}
                    />
                  )
                }
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
              style={{ padding: 0, width: `100%`, overflow: 'hidden' }}
              leftIcon={
                <IconTrashX style={{ color: theme.colors.red[7] }} stroke={1.5} size={18} />
              }
              onClick={deleteLayer}
              variant="subtle"
              color="gray"
              styles={() => ({
                icon: {
                  margin: 0,
                  marginRight: 0
                },
                leftIcon: {
                  margin: 0,
                  marginRight: 0
                }
              })}
            />
          </animated.div>
          <FeatureHistogramModal
            ref={featureHistogramModalRef}
            uid={layer.uid}
            gerberApp={gerberApp}
          />
        </div>
      </Popover.Target>
      <Popover.Dropdown
        style={{
          padding: '0.5rem'
        }}
      >
        <ColorPicker
          style={{ width: '100%' }}
          value={chroma(color as any).hex()}
          onChangeEnd={(color) => {
            changeColor(color)
            setShowColorPicker(false)
          }}
          swatchesPerRow={7}
          format="hex"
          swatches={[
            '#25262b',
            '#868e96',
            '#fa5252',
            '#e64980',
            '#be4bdb',
            '#7950f2',
            '#4c6ef5',
            '#228be6',
            '#15aabf',
            '#12b886',
            '#40c057',
            '#82c91e',
            '#fab005',
            '#fd7e14'
          ]}
        />
      </Popover.Dropdown>
    </Popover>
  )
}
