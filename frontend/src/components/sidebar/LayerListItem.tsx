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

const { useToken } = theme
interface LayerListItemProps {
  layer: Layers
  file: UploadFile
}

export default function LayerListItem(props: LayerListItemProps) {
  const { token } = useToken()
  const [{ x, y, width }, api] = useSpring(() => ({ x: 0, y: 0, width: 0 }))
  let lastx = 0
  const bind = useGesture(
    {
      onDrag: ({ down, offset: [mx, my] }) => {
        if (down) {
          api.start({ x: mx, y: my, width: -mx })
          lastx = mx
        } else {
          api.start({ x: lastx < -20 ? -40 : 0, y: 0, width: lastx < -20 ? 40 : 0 })
        }
      },
      onWheel: ({ down, offset: [mx, my] }) => {
        api.start({ x: -mx, y: my, width: mx })
      },
    },
    {
      drag: {
        axis: 'x',
        bounds: { left: -40, right: 1, top: 0, bottom: 0 },
      },
      wheel: {
        axis: 'x',
        bounds: { left: 0, right: 40, top: 0, bottom: 0 },
      },
    }
  )

  useEffect(() => {
    console.log('x', x)
  }, [x])

  return (
    <div style={{ display: 'flex' }}>
      <animated.div {...bind()} style={{ width: '100%', overflow: 'hidden' }}>
        <Button
          style={{
            textAlign: 'left',
            marginTop: 3,
            width: '100%',
            overflow: 'hidden',
            padding: 0,
          }}
          type='text'>
          <Space.Compact>
            <Popover placement='right' title={'Color'} content={<CirclePicker />} trigger='hover'>
              {/* @ts-ignore */}
              <Badge color={chroma(props.layer.color).hex()} style={{ margin: '0px 10px' }} />
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
        />
      </animated.div>
    </div>
  )
}
