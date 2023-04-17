import React, { useRef, useEffect, useState, useLayoutEffect, useMemo } from 'react'
import {
  Button,
  Card,
  ConfigProvider,
  Divider,
  List,
  Modal,
  Space,
  Switch,
  ThemeConfig,
  theme,
  Typography,
  Upload,
  message,
  Tag,
  Popover,
  Badge,
  UploadFile,
  Row,
  Col,
} from 'antd'
import type { UploadProps } from 'antd'
import chroma from 'chroma-js'
import { ColorSource } from 'pixi.js'
import { DeleteOutlined, CloseCircleOutlined } from '@ant-design/icons'
import { BlockPicker, CirclePicker } from 'react-color'

import { useDrag, useScroll, useWheel, useGesture } from '@use-gesture/react'
import { animated, useSpring } from '@react-spring/web'
import { Layers } from '../../renderer/types'
import OffscreenGerberApplication from '../../renderer/offscreen'
import { ConfigEditorProvider } from '../../App'

const { useToken } = theme
interface LayerListItemProps {
  layer: Layers
  file: UploadFile
  gerberApp: OffscreenGerberApplication
}

export default function LayerListItem(props: LayerListItemProps) {
  const { gerberApp, layer } = props
  const { token } = useToken()
  const { transparency, blur } = React.useContext(ConfigEditorProvider)
  const [{ x, y, width }, api] = useSpring(() => ({ x: 0, y: 0, width: 0 }))
  const [color, setColor] = useState<ColorSource>(layer.color)
  const [visible, setVisible] = useState<boolean>(layer.visible)

  async function deleteLayer() {
    const renderer = await gerberApp.renderer
    if (!renderer) return
    await renderer.removeLayer(layer.name)
  }

  async function changeColor(color: ColorSource) {
    const renderer = await gerberApp.renderer
    if (!renderer) return
    await renderer.tintLayer(layer.name, color)
    setColor(color)
  }

  async function toggleVisible() {
    const renderer = await gerberApp.renderer
    if (!renderer) return
    if (visible) {
      renderer.hideLayer(layer.name)
      setVisible(false)
    } else {
      renderer.showLayer(layer.name)
      setVisible(true)
    }
  }

  let lastx = 0
  const bind = useGesture(
    {
      onDrag: ({ down, offset: [mx, my], first, last, event, tap }) => {
        event.stopPropagation()
        if (down) {
          api.start({ x: mx, y: my, width: -mx })
          lastx = mx
        } else {
          api.start({ x: lastx < -20 ? -40 : 0, y: 0, width: lastx < -20 ? 40 : 0 })
        }
      },
      onWheel: ({ down, offset: [mx, my], first, last }) => {
        api.start({ x: -mx, y: my, width: mx })
      }
    },
    {
      drag: {
        axis: 'x',
        bounds: { left: -40, right: 1, top: 0, bottom: 0 },
        filterTaps: true,
      },
      wheel: {
        axis: 'x',
        bounds: { left: 0, right: 40, top: 0, bottom: 0 },
      },
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
            padding: 0,
          }}
          type='text'
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
          }}>
          <Space.Compact>
            <Popover
              placement='right'
              title={'Color'}
              content={
                <CirclePicker
                  color={chroma(color as any).hex()}
                  onChange={(color) => changeColor(color.hex)}
                />
              }
              trigger='click'>
              <Badge
                color={visible ? chroma(color as any).hex() : 'rgba(0,0,0,0)'}
                style={{ margin: '0px 10px' }}
              />
            </Popover>
            {props.file.name}
          </Space.Compact>
        </Button>
      </animated.div>
      <animated.div {...bind()} style={{ width }}>
        <Button
          // danger
          type='text'
          style={{ padding: 0, width: `100%`, overflow: 'hidden', marginTop: 3 }}
          icon={<DeleteOutlined style={{ color: token['red-5'] }} />}
          onClick={deleteLayer}
        />
      </animated.div>
    </div>
  )
}
