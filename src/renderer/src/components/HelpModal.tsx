import React from 'react'
import { QuestionOutlined } from '@ant-design/icons'
import { Button, Card, Space, theme } from 'antd'
import chroma from 'chroma-js'
import { ConfigEditorProvider } from '../contexts/ConfigEditor'
const { useToken } = theme

export default function HelpModal(): JSX.Element | null {
  const { token } = useToken()
  const { transparency, blur } = React.useContext(ConfigEditorProvider)
  return (
    <Card
      style={{
        width: 'unset',
        height: 'unset',
        position: 'absolute',
        bottom: 10,
        right: 10,
        backgroundColor: transparency
          ? chroma(token.colorBgElevated).alpha(0.7).css()
          : chroma(token.colorBgElevated).css(),
        backdropFilter: transparency ? `blur(${blur}px)` : '',
        pointerEvents: 'all'
      }}
      bodyStyle={{ padding: 3 }}
    >
      <Space size={1}>
        <Button icon={<QuestionOutlined />} type="text" />
      </Space>
    </Card>
  )
}
