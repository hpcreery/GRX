import React, { useRef, useEffect, useState, useLayoutEffect, useMemo } from 'react'
import OffscreenGerberApplication from '../renderer/offscreen'
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
import { PlusOutlined } from '@ant-design/icons'

import { Layers } from '../renderer/types'
import * as Comlink from 'comlink'
import LayerListItem from './sidebar/LayerListItem'

const { useToken } = theme
const { Dragger } = Upload
const { Text, Link, Title } = Typography

interface GerberLayers extends UploadFile {
  color: ColorSource
  visible: boolean
  zIndex: number
}

// import type { Layers as GerberLayers } from '../renderer/types'

interface SidebarProps {
  gerberApp: React.MutableRefObject<OffscreenGerberApplication | undefined>
}

export default function LayerSidebar({ gerberApp }: SidebarProps) {
  const { token } = useToken()
  const [layers, setLayers] = useState<GerberLayers[]>([])

  useEffect(() => {
    if (gerberApp.current) {
      gerberApp.current.renderer.then(async (r) => {
        r.addViewportListener(
          'childAdded',
          Comlink.proxy(async () => {
            const layers = (await r.layers) as GerberLayers[]
            console.log('childAdded', layers)
            setLayers(layers)
          })
        )
      })
    }
    return () => {}
  }, [gerberApp.current])

  const props: UploadProps = {
    // name: 'file',
    listType: 'picture',
    multiple: true,
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
        // @ts-ignore
        gerberApp.current?.addGerber(options.file.name, reader.result as string)
        options.onSuccess && options.onSuccess(reader.result)
      }
    },
    // onSuccess: (data, file, fileList) => {
    //   console.log('onSuccess', data, file, fileList)
    // },
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
    },
    onDrop(e) {
      console.log('Dropped files', e.dataTransfer.files)
    },
    itemRender: (originNode, file, currFileList) => {
      const layer = layers.find((l) => l.uid === file.uid)
      if (layer === undefined) return
      return <LayerListItem layer={layer} file={file} />
    },
  }

  return (
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
          overflow: 'hidden',
        }}
        bodyStyle={{ padding: 3 }}>
        <Dragger {...props}>
          <PlusOutlined />
        </Dragger>
      </Card>
    </div>
  )
}
