/** @jsxImportSource @emotion/react */
import React from 'react'
import { Button, Card, Descriptions, Space, theme, Tooltip } from 'antd'
import chroma from 'chroma-js'
import { ConfigEditorProvider } from '../App'
import OffscreenGerberApplication, { PointerEvent } from '../renderer/offscreen'

const { useToken } = theme

interface MousePositionProps {
  gerberApp: OffscreenGerberApplication
}

export default function MousePosition(props: MousePositionProps) {
  const { gerberApp } = props
  const { token } = useToken()
  const { transparency, blur } = React.useContext(ConfigEditorProvider)

  const [x, setX] = React.useState<number>(0)
  const [y, setY] = React.useState<number>(0)

  React.useEffect(() => {
    const handleMouseMove = (e: PointerEvent) => {
      setX(e.detail.x)
      setY(e.detail.y)
    }
    gerberApp.pointer.addEventListener('pointermove', handleMouseMove as EventListener)
    return () => {
      gerberApp.pointer.removeEventListener('pointermove', handleMouseMove as EventListener)
    }
  }, [])

  return (
    <Tooltip title="Units: Mils" placement="left">
    <Descriptions
      bordered
      size='small'
      style={{
        position: 'absolute',
        bottom: 10,
        right: 60,
        pointerEvents: 'all',
      }}
      labelStyle={{
        width: 20,
      }}
      contentStyle={{
        width: 100,
      }}
      css={{
        div: {
          backgroundColor: transparency ? chroma(token.colorBgElevated).alpha(0.7).css() : chroma(token.colorBgElevated).css(),
          backdropFilter: transparency ? `blur(${blur}px)` : '',
        },
        span: {
          whiteSpace: 'nowrap',
        }
      }}
      
      >
      <Descriptions.Item label='X:'>{x.toFixed(2)}</Descriptions.Item>
      <Descriptions.Item label='Y:'>{y.toFixed(2)}</Descriptions.Item>
    </Descriptions>
    </Tooltip>
  )
}
