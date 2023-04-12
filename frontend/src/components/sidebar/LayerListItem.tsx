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
} from 'antd'
import type { UploadProps } from 'antd'
import chroma from 'chroma-js'
import { ColorSource } from 'pixi.js'
import {
  SearchOutlined,
  DragOutlined,
  CloudDownloadOutlined,
  FullscreenOutlined,
  HomeOutlined,
  LineOutlined,
  ToolOutlined,
  QuestionOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
  PlusOutlined,
  DeleteOutlined,
} from '@ant-design/icons'
import { BlockPicker, CirclePicker } from 'react-color'

import { useDrag, useScroll, useWheel } from '@use-gesture/react'
import { animated, useSpring } from '@react-spring/web'
import { Layers } from '../../renderer/types'

interface LayerListItemProps {
  layer: Layers
  file: UploadFile
}

export default function LayerListItem(props: LayerListItemProps) {
  const [{ x, y }, api] = useSpring(() => ({ x: 0, y: 0 }))
  const bind = useWheel(
    ({ offset: [mx, my] }) => {
      api.start({ x: -mx, y: my })
    },
    {
      axis: 'x',
      bounds: { left: 0, right: 40 },
      // rubberband: true,
      axisThreshold: 10,
      // swipe: {
      //   velocity: 10,
      // },
    }
  )
  return (
    <animated.div {...bind()} style={{ x, y }}>
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
  )
}
