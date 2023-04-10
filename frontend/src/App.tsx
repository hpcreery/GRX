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
import { useDrag } from '@use-gesture/react'
import HelpModal from './components/HelpModal'
import Toolbar from './components/Toolbar'

const { useToken } = theme
const { Dragger } = Upload
const { Text, Link, Title } = Typography
const uid = () =>
  Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)

interface ThemeContext {
  themeState: ThemeConfig
  setThemeState: React.Dispatch<React.SetStateAction<ThemeConfig>>
}

export const ConfigEditorProvider = React.createContext<ThemeContext>({
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

interface GerberLayers extends UploadFile {
  color?: ColorSource
}

export function UIElements() {
  const data = ['Top Soldermask', 'Top Copper', 'Layer 2', 'Layer 3', 'Layer 4']
  const { token } = useToken()
  const { themeState, setThemeState } = React.useContext(ConfigEditorProvider)
  const elementRef = useRef<HTMLDivElement>(document.createElement('div'))
  const gerberApp = useRef<OffscreenGerberApplication>()
  const [layers, setLayers] = useState<GerberLayers[]>([])

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
        renderer.renderer.background.color = chroma(token.colorBgContainer).num()
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
    getGerber(sample1).then((gerber) => app.addGerber('sample1', gerber))
    getGerber(sample2).then((gerber) => app.addGerber('sample2', gerber))
    setLayers([
      { uid: uid(), name: 'sample1', status: 'done' },
      { uid: uid(), name: 'sample2', status: 'done' },
    ])

    // getGerber('http://127.0.0.1:8080/sample1.gbr').then((gerber) => app.addGerber(gerber))
    // getGerber('http://127.0.0.1:8080/sample2.gbr').then((gerber) => app.addGerber(gerber))

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

  const props: UploadProps = {
    name: 'file',
    listType: 'picture',
    multiple: true,
    // defaultFileList: gerberApp.current?.renderer.then((renderer) => {
    //   return renderer.viewport.children.map((layer) => {
    //     return {
    //       uid: layer.id,
    //       name: layer.name,
    //       status: 'done',
    //       url: '',
    //     }
    //   })
    // }),
    fileList: layers,
    customRequest: async (options) => {
      console.log(options)
      const reader = new FileReader()
      if (!options.file) {
        options.onError && options.onError(new Error('No file provided'), options.file)
        return
      }
      const file = options.file as Blob
      reader.readAsText(file)
      reader.onerror = (err) => {
        options.onError && options.onError(err, 'Error reading file')
      }
      reader.onabort = (err) => {
        options.onError && options.onError(err, 'File read aborted')
      }
      reader.onprogress = (e) => {
        const percent = Math.round((e.loaded / e.total) * 100)
        options.onProgress && options.onProgress({ percent })
      }
      reader.onload = () => {
        gerberApp.current?.addGerber(options.filename || '', reader.result as string)
        options.onSuccess && options.onSuccess(reader.result)
      }
    },
    onChange(info) {
      const { status } = info.file
      if (status !== 'uploading') {
        console.log(info.file, info.fileList)
      }
      if (status === 'done') {
        message.success(`${info.file.name} file uploaded successfully.`)
        // console.log(info)
      } else if (status === 'error') {
        message.error(`${info.file.name} file upload failed.`)
        // console.log(info)
      }
      setLayers(info.fileList)
    },
    onDrop(e) {
      console.log('Dropped files', e.dataTransfer.files)
    },
    itemRender: (originNode, file, currFileList) => {
      // originNode.props.style = {
      //   ...originNode.props.style,
      //   padding: '1px',
      //   margin: '1px',
      // }
      // return (
      //   <div>
      //     {originNode}
      //   </div>
      // )
      return (
        // <Space.Compact style={{ marginTop: 3, width: '100%' }}>
        <Button
          style={{
            // padding: '1px',
            // margin: '3px 0px 0px 0px',
            textAlign: 'left',
            marginTop: 3,
            width: '100%',
            overflow: 'hidden',
            padding: 0,
          }}
          // bodyStyle={{
          //   padding: '3px',
          //   // margin: '1px',
          //   // lineHeight: '13px',
          // }}
          type='text'>
          <Space.Compact>
            <Popover placement='right' title={'Color'} content={<CirclePicker />} trigger='hover'>
              {/* <Button type='text'>C</Button> */}
              <Badge color='#f50' style={{ margin: '0px 10px' }} />
            </Popover>
            {file.name}
          </Space.Compact>
        </Button>
        // </Space.Compact>
      )
    },
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
        <Card
          style={{
            width: 200,
            height: '-webkit-fill-available',
            margin: 10,
            backdropFilter: 'blur(50px)',
            backgroundColor: chroma(token.colorBgElevated).alpha(0.7).css(),
            pointerEvents: 'all',
          }}
          bodyStyle={{ padding: 3 }}>
          <Dragger {...props}>
            {/* <Button icon={<PlusOutlined />} type='text' /> */}
            <PlusOutlined />
          </Dragger>
        </Card>
        <Toolbar gerberApp={gerberApp} />
        <HelpModal />
      </div>
      <div id='GRX' style={{ width: '100%', height: '100%' }} ref={elementRef} />
    </>
  )
}
