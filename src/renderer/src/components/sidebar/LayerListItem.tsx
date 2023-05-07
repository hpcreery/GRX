/** @jsxImportSource @emotion/react */
import { useState, useEffect, useRef } from 'react'
import { Button, Space, theme, Popover, Badge, UploadFile, Spin, Dropdown, MenuProps } from 'antd'
import {
  BgColorsOutlined,
  EyeInvisibleOutlined,
  LoadingOutlined,
  EyeOutlined,
  BarChartOutlined
} from '@ant-design/icons'
import chroma from 'chroma-js'
import { ColorSource } from 'pixi.js'
import { DeleteOutlined } from '@ant-design/icons'
import { CirclePicker } from 'react-color'

import { useGesture } from '@use-gesture/react'
import { animated, useSpring } from '@react-spring/web'
import { TRendererLayer } from '../../renderer/types'
import VirtualGerberApplication from '../../renderer/virtual'
import * as Comlink from 'comlink'
import FeatureHistogramModal, { FeatureHistogramModalRef } from '../histogram/FeatureHistogramModal'
// import { ConfigEditorProvider } from '../../contexts/ConfigEditor'

const { useToken } = theme
interface LayerListItemProps {
  file: UploadFile
  gerberApp: VirtualGerberApplication
  actions: {
    download: () => void
    preview: () => void
    remove: () => void
  }
}

export default function LayerListItem(props: LayerListItemProps): JSX.Element | null {
  const { gerberApp, file, actions } = props
  const layer: Pick<TRendererLayer, 'name' | 'uid'> = {
    name: file.name,
    uid: file.uid
  }
  const { token } = useToken()
  // const { transparency, blur } = React.useContext(ConfigEditorProvider)
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
    gerberApp.renderer.then(async (r) => {
      registerLayers(await r.layers)
      r.addViewportListener(
        'childAdded',
        Comlink.proxy(async () => {
          registerLayers(await r.layers)
        })
      )
    })
    return (): void => {}
  }, [])

  function deleteLayer(): void {
    actions.remove()
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

  const items: MenuProps['items'] = [
    {
      label: 'Change Color',
      key: '1',
      icon: <BgColorsOutlined />,
      onClick: (): void => {
        setTimeout(() => {
          setShowColorPicker(true)
        }, 100)
      }
    },
    {
      label: visible ? 'Hide Layer' : 'Show Layer',
      key: '3',
      icon: visible ? <EyeInvisibleOutlined /> : <EyeOutlined />,
      onClick: toggleVisible
    },
    {
      label: 'Features Histogram',
      key: '4',
      icon: <BarChartOutlined />,
      onClick: (): void => {
        featureHistogramModalRef.current?.open()
      }
    },
    {
      type: 'divider'
    },
    {
      label: 'Delete Layer',
      key: '0',
      icon: <DeleteOutlined />,
      danger: true,
      onClick: deleteLayer
    }
  ]

  const handleOpenChange = (open: boolean): void => {
    setShowColorPicker(open)
  }

  return (
    <div style={{ display: 'flex' }}>
      <Dropdown menu={{ items }} trigger={['contextMenu']}>
        <animated.div {...bind()} style={{ width: '100%', overflow: 'hidden' }}>
          <Button
            style={{
              textAlign: 'left',
              marginTop: 5,
              width: '100%',
              overflow: 'hidden',
              padding: 0
            }}
            type="text"
            onClick={(e): void => {
              if (
                !(
                  e.target instanceof HTMLDivElement &&
                  e.target.parentNode instanceof HTMLButtonElement
                )
              ) {
                return
              }
              toggleVisible()
            }}
          >
            <Space.Compact>
              {loading ? (
                <Spin
                  indicator={<LoadingOutlined style={{ fontSize: 14, margin: '0px 6px' }} spin />}
                />
              ) : (
                <Popover
                  open={showColorPicker}
                  onOpenChange={handleOpenChange}
                  placement="right"
                  title={'Color'}
                  content={
                    <CirclePicker
                      color={chroma(color as any).hex()}
                      onChange={(color): Promise<void> => changeColor(color.hex)}
                    />
                  }
                  trigger="click"
                >
                  <Badge
                    color={visible ? chroma(color as any).hex() : 'rgba(0,0,0,0)'}
                    style={{ margin: '0px 10px' }}
                  />
                </Popover>
              )}
              {file.name}
            </Space.Compact>
          </Button>
        </animated.div>
      </Dropdown>
      <animated.div {...bind()} style={{ width }}>
        <Button
          // danger
          type="text"
          style={{ padding: 0, width: `100%`, overflow: 'hidden', marginTop: 3 }}
          icon={<DeleteOutlined style={{ color: token['red-5'] }} />}
          onClick={deleteLayer}
        />
      </animated.div>
      <FeatureHistogramModal ref={featureHistogramModalRef} uid={layer.uid} gerberApp={gerberApp} />
    </div>
  )
}
