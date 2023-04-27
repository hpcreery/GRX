/** @jsxImportSource @emotion/react */
import React from 'react'
import { Descriptions, theme, Tooltip } from 'antd'
import chroma from 'chroma-js'
import { ConfigEditorProvider } from '../contexts/ConfigEditor'
import VirtualGerberApplication, { PointerEvent } from '../renderer/virtual'

const { useToken } = theme

interface MousePositionProps {
  gerberApp: VirtualGerberApplication
}

export default function MousePosition(props: MousePositionProps): JSX.Element | null {
  const { gerberApp } = props
  const { token } = useToken()
  const { transparency, blur, componentSize } = React.useContext(ConfigEditorProvider)

  const [x, setX] = React.useState<number>(0)
  const [y, setY] = React.useState<number>(0)

  React.useEffect(() => {
    const handleMouseMove = (e: PointerEvent): void => {
      setX(e.detail.x)
      setY(e.detail.y)
    }
    gerberApp.pointer.addEventListener('pointermove', handleMouseMove as EventListener)
    gerberApp.pointer.addEventListener('pointerdown', handleMouseMove as EventListener)
    return () => {
      gerberApp.pointer.removeEventListener('pointermove', handleMouseMove as EventListener)
      gerberApp.pointer.removeEventListener('pointerdown', handleMouseMove as EventListener)
    }
  }, [])

  return (
    <Tooltip title="Units: Mils" placement="left">
      <Descriptions
        bordered
        // size="small"
        style={{
          position: 'absolute',
          bottom: 10,
          right: 60,
          pointerEvents: 'all'
        }}
        labelStyle={{
          width: 20,
          padding: '0px 12px'
        }}
        contentStyle={{
          width: 100,
          height: componentSize === 'small' ? 32 : componentSize === 'middle' ? 38 : 46,
          padding: '0px 12px'
        }}
        css={{
          div: {
            backgroundColor: transparency
              ? chroma(token.colorBgElevated).alpha(0.7).css()
              : chroma(token.colorBgElevated).css(),
            backdropFilter: transparency ? `blur(${blur}px)` : ''
          },
          span: {
            whiteSpace: 'nowrap'
          }
        }}
      >
        <Descriptions.Item label="X:">{x.toFixed(2)}</Descriptions.Item>
        <Descriptions.Item label="Y:">{y.toFixed(2)}</Descriptions.Item>
      </Descriptions>
    </Tooltip>
  )
}
