import { useState, useEffect } from 'react'
import { Button, Space, theme, Popover, Badge, UploadFile, Spin } from 'antd'
import { LoadingOutlined } from '@ant-design/icons'
import chroma from 'chroma-js'
import { ColorSource } from 'pixi.js'
import { DeleteOutlined } from '@ant-design/icons'
import { CirclePicker } from 'react-color'

import { useGesture } from '@use-gesture/react'
import { animated, useSpring } from '@react-spring/web'
import { RendererLayer } from '../../renderer/types'
import VirtualGerberApplication from '../../renderer/virtual'
// import { ConfigEditorProvider } from '../../contexts/ConfigEditor'
import * as Comlink from 'comlink'

const { useToken } = theme
interface LayerListItemProps {
  // layer: Layers
  file: UploadFile
  gerberApp: VirtualGerberApplication
  actions: {
    download: () => void;
    preview: () => void;
    remove: () => void;
  }
}

export default function LayerListItem(props: LayerListItemProps) {
  const { gerberApp, file, actions } = props
  const layer: RendererLayer = {
    name: file.name,
    uid: file.uid,
    color: 0x000000,
    visible: false,
    zIndex: 0
  }
  const { token } = useToken()
  // const { transparency, blur } = React.useContext(ConfigEditorProvider)
  const [{ width }, api] = useSpring(() => ({ x: 0, y: 0, width: 0 }))
  const [color, setColor] = useState<ColorSource>(layer.color)
  const [visible, setVisible] = useState<boolean>(layer.visible)
  // const [zIndex, setzIndex] = useState<number>(layer.zIndex)
  // const [progress, setProgress] = useState<number>(0)
  const [loading, setLoading] = useState<boolean>(true)

  function registerLayers(rendererLayers: RendererLayer[]) {
    let newLayer = rendererLayers.find((l) => l.uid === layer.uid)
    if (newLayer) {
      setColor(newLayer.color)
      setVisible(newLayer.visible)
      // setzIndex(newLayer.zIndex)
      setLoading(false)
    }
  }

  useEffect(() => {
    gerberApp.renderer.then(async (r) => {
      registerLayers(await r.layers)
      r.addViewportListener(
        'childAdded',
        Comlink.proxy(async () => {
          console.log('childAdded')
          registerLayers(await r.layers)
        })
      )
    })
    return () => {}
  }, [])

  async function deleteLayer() {
    actions.remove()
  }

  async function changeColor(color: ColorSource) {
    const renderer = await gerberApp.renderer
    if (!renderer) return
    await renderer.tintLayer(layer.uid, color)
    setColor(color)
  }

  async function toggleVisible() {
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

  return (
    <div style={{ display: 'flex' }}>
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
          onClick={(e) => {
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
                placement="right"
                title={'Color'}
                content={
                  <CirclePicker
                    color={chroma(color as any).hex()}
                    onChange={(color) => changeColor(color.hex)}
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
      <animated.div {...bind()} style={{ width }}>
        <Button
          // danger
          type="text"
          style={{ padding: 0, width: `100%`, overflow: 'hidden', marginTop: 3 }}
          icon={<DeleteOutlined style={{ color: token['red-5'] }} />}
          onClick={deleteLayer}
        />
      </animated.div>
    </div>
  )
}
