import React from 'react'
import {
  DragOutlined,
  HomeOutlined,
  LineOutlined,
  ToolOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
} from '@ant-design/icons'
import { Button, Card, Divider, Modal, Space, Switch, theme, Typography } from 'antd'
import chroma from 'chroma-js'
import OffscreenGerberApplication from '../renderer/offscreen'
import { ConfigEditorProvider } from '../App'
const { useToken } = theme
const { Title } = Typography

interface ToolbarProps {
  gerberApp: React.MutableRefObject<OffscreenGerberApplication | undefined>
}

export default function Toolbar({ gerberApp }: ToolbarProps) {
  const { token } = useToken()
  const [settingsModalOpen, settingsSetModalOpen] = React.useState<boolean>(false)
  const { themeState, setThemeState } = React.useContext(ConfigEditorProvider)

  const showModal = () => {
    settingsSetModalOpen(true)
  }

  const handleSettingsModalOk = () => {
    settingsSetModalOpen(false)
  }

  const handleSettingsModalCancel = () => {
    settingsSetModalOpen(false)
  }

  return (
    <>
      <Card
        style={{
          width: 'unset',
          height: 'unset',
          position: 'absolute',
          top: 10,
          right: 10,
          backgroundColor: chroma(token.colorBgElevated).alpha(0.7).css(),
          backdropFilter: 'blur(50px)',
          pointerEvents: 'all',
        }}
        bodyStyle={{ padding: 3 }}>
        <Space size={1}>
          <Button icon={<DragOutlined />} type='text' />
          <Button icon={<LineOutlined />} type='text' />
          <Divider type='vertical' style={{ margin: '0 3px' }} />
          <Button
            icon={<ZoomInOutlined />}
            onClick={() => {
              if (gerberApp.current) {
                gerberApp.current.zoom(-50)
              }
            }}
            type='text'
          />
          <Button
            icon={<ZoomOutOutlined />}
            onClick={() => {
              if (gerberApp.current) {
                gerberApp.current.zoom(50)
              }
            }}
            type='text'
          />
          <Button
            icon={<HomeOutlined />}
            onClick={() => {
              gerberApp.current && gerberApp.current.zoomHome()
              gerberApp.current && gerberApp.current.virtualViewport.decelerate()
            }}
            type='text'
          />
          <Divider type='vertical' style={{ margin: '0 3px' }} />
          <Button icon={<ToolOutlined />} onClick={() => showModal()} type='text' />
          {/* <Button icon={<FullscreenOutlined />} type='text' /> */}
          {/* <Button icon={<CloudDownloadOutlined />} type='text' /> */}
          {/* <Button icon={<SearchOutlined />} type='text' /> */}
        </Space>
      </Card>
      <Modal
        title='Settings'
        open={settingsModalOpen}
        onOk={handleSettingsModalOk}
        onCancel={handleSettingsModalCancel}>
        <Divider />
        <Title level={5}>Dark Mode</Title>
        <Switch
          defaultChecked={themeState.algorithm === theme.darkAlgorithm}
          onChange={(checked) => {
            if (checked) {
              setThemeState({ algorithm: theme.darkAlgorithm })
            } else {
              setThemeState({ algorithm: theme.defaultAlgorithm })
            }
          }}
        />
      </Modal>
    </>
  )
}
