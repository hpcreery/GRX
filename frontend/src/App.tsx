import './App.css'
import React, { useRef, useEffect, useState, useLayoutEffect, useMemo } from 'react'
import gerber from './gerbers/gerber.gbr'
import l7spath from './gerbers/l7s.gbr'
import l4spath from './gerbers/l4s.gbr'
import bvgerber from './gerbers/bv_1-5.gbr'
import b_cu from './gerbers/Watchy_B_Cu.gbr'
import b_mask from './gerbers/Watchy_B_Mask.gbr'
import b_paste from './gerbers/Watchy_B_Paste.gbr'
import f_cu from './gerbers/Watchy_F_Cu.gbr'
import f_mask from './gerbers/Watchy_F_Mask.gbr'
import f_paste from './gerbers/Watchy_F_Paste.gbr'
import edge_cuts from './gerbers/Watchy_Edge_Cuts.gbr'
import sample1 from './gerbers/sample1.gbr'
import sample2 from './gerbers/sample2.gbr'
import lampad from './gerbers/lampad.gbr'
import OffscreenGerberApplication from './renderer/offscreen'
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
} from 'antd'
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
} from '@ant-design/icons'

const { useToken } = theme
const { Text, Link, Title } = Typography;



type ThemeContext = {
  themeState: ThemeConfig
  setThemeState: React.Dispatch<React.SetStateAction<ThemeConfig>>
}

const ConfigEditorProvider = React.createContext<ThemeContext>({
  themeState: { algorithm: theme.darkAlgorithm },
  setThemeState: () => {},
})
// export default App
export default function Main() {
  const data = ['Top Soldermask', 'Top Copper', 'Layer 2', 'Layer 3', 'Layer 4']
  const [themeState, setThemeState] = useState<ThemeConfig>({ algorithm: theme.darkAlgorithm })
  return (
    <ConfigProvider theme={themeState}>
      <ConfigEditorProvider.Provider value={{ themeState, setThemeState }}>
        <UIElements />
      </ConfigEditorProvider.Provider>
    </ConfigProvider>
  )
}

export function UIElements() {
  const data = ['Top Soldermask', 'Top Copper', 'Layer 2', 'Layer 3', 'Layer 4']
  const { token } = useToken()
  const { themeState, setThemeState } = React.useContext(ConfigEditorProvider)
  const elementRef = useRef<HTMLDivElement>(document.createElement('div'))
  const gerberApp = useRef<OffscreenGerberApplication>()
  const [settingsModalOpen, settingsSetModalOpen] = useState(false)

  const showModal = () => {
    settingsSetModalOpen(true)
  }

  const handleSettingsModalOk = () => {
    settingsSetModalOpen(false)
  }

  const handleSettingsModalCancel = () => {
    settingsSetModalOpen(false)
  }

  // Load in the gerber application
  useEffect(() => {
    gerberApp.current = insertGerberApp(elementRef.current)
    return () => {
      gerberApp.current && gerberApp.current.destroy()
      elementRef.current.innerHTML = ''
    }
  }, [])

  // Update the background color of the gerber application
  useEffect(() => {
    if (gerberApp.current) {
      gerberApp.current.renderer.then((renderer) => {
        // @ts-ignore
        renderer.renderer.backgroundColor = chroma(token.colorBgContainer).num()
        // renderer.zoomHome()
      })
      // gerberApp.current.zoomHome()
    }
  }, [token.colorBgContainer])

  async function getGerber(path: string) {
    const gerber = await fetch(path).then((res) => res.text())
    return gerber
  }

  function insertGerberApp(element: HTMLDivElement) {
    let app = new OffscreenGerberApplication({
      element: element,
      antialias: false,
      backgroundColor: chroma(token.colorBgContainer).num() || 0x0e0e0e,
    })

    // getGerber(l7spath).then((gerber) => app.addGerber(gerber))
    // getGerber(l4spath).then((gerber) => app.addGerber(gerber))
    // getGerber(bvgerber).then((gerber) => app.addGerber(gerber))
    // getGerber(sample1).then((gerber) => app.addGerber(gerber))
    // getGerber(sample2).then((gerber) => app.addGerber(gerber))
    getGerber('http://127.0.0.1:8080/sample1.gbr').then((gerber) => app.addGerber(gerber))
    getGerber('http://127.0.0.1:8080/sample2.gbr').then((gerber) => app.addGerber(gerber))

    // getGerber(b_cu).then((gerber) => app.addGerber(gerber))
    // getGerber(b_mask).then((gerber) => app.addGerber(gerber))
    // getGerber(b_paste).then((gerber) => app.addGerber(gerber))
    // getGerber(f_cu).then((gerber) => app.addGerber(gerber))
    // getGerber(f_mask).then((gerber) => app.addGerber(gerber))
    // getGerber(f_paste).then((gerber) => app.addGerber(gerber))
    // getGerber(edge_cuts).then((gerber) => app.addGerber(gerber))

    // getGerber(gerber).then((gerber) => app.addGerber(gerber))

    // getGerber(lampad).then((gerber) => app.addGerber(gerber))

    return app
  }

  return (
    <>
      <div
        style={{
          width: '100vw',
          height: '100vh',
          position: 'fixed',
          pointerEvents: 'none',
          zIndex: 10,
        }}>
        <List
          style={{
            width: 200,
            height: '-webkit-fill-available',
            margin: 10,
            backdropFilter: 'blur(50px)',
            backgroundColor: chroma(token.colorBgElevated).alpha(0.7).css(),
            pointerEvents: 'all',
          }}
          size='small'
          header={<div>Layers</div>}
          footer={<div>Footer</div>}
          bordered
          dataSource={data}
          renderItem={(item) => <List.Item>{item}</List.Item>}
        />
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
      </div>
      <Modal
        title='Settings'
        open={settingsModalOpen}
        onOk={handleSettingsModalOk}
        onCancel={handleSettingsModalCancel}>
        <Divider />
        <Title level={5}>Dark Mode</Title>
        <Switch
          defaultChecked={themeState.algorithm === theme.darkAlgorithm}
          // checkedChildren="light" unCheckedChildren="dark"
          onChange={(checked) => {
            if (checked) {
              setThemeState({ algorithm: theme.darkAlgorithm })
            } else {
              setThemeState({ algorithm: theme.defaultAlgorithm })
            }
          }}
        />
      </Modal>
      <div id='GRX' style={{ width: '100%', height: '100%' }} ref={elementRef} />
    </>
  )
}
