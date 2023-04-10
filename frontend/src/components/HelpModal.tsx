import React from 'react'
import { QuestionOutlined } from '@ant-design/icons'
import { Button, Card, Space, theme } from 'antd'
import chroma from 'chroma-js'
const { useToken } = theme

export default function HelpModal() {
  const { token } = useToken()
  return (
    <Card
      style={{
        width: 'unset',
        height: 'unset',
        position: 'absolute',
        bottom: 10,
        right: 10,
        backgroundColor: chroma(token.colorBgElevated).alpha(0.7).css(),
        backdropFilter: 'blur(50px)',
        pointerEvents: 'all',
      }}
      bodyStyle={{ padding: 3 }}>
      <Space size={1}>
        <Button icon={<QuestionOutlined />} type='text' />
      </Space>
    </Card>
  )
}
