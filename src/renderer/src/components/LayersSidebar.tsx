/** @jsxImportSource @emotion/react */
import React, { useEffect, useState } from 'react'
import VirtualGerberApplication from '../renderer/virtual'
import { Card, theme, Upload, message, UploadFile } from 'antd'
import type { UploadProps } from 'antd'
import chroma from 'chroma-js'
import { PlusOutlined } from '@ant-design/icons'

// import * as Comlink from 'comlink'
import LayerListItem from './sidebar/LayerListItem'
import { ConfigEditorProvider } from '../contexts/ConfigEditor'
import { RendererLayer } from '@renderer/renderer/types'

const { useToken } = theme
const { Dragger } = Upload

interface SidebarProps {
  gerberApp: VirtualGerberApplication
}

export default function LayerSidebar({ gerberApp }: SidebarProps): JSX.Element | null {
  const { token } = useToken()
  const [layers, setLayers] = useState<UploadFile[]>([])
  const { transparency, blur } = React.useContext(ConfigEditorProvider)
  const [messageApi, contextHolder] = message.useMessage()

  function registerLayers(rendererLayers: RendererLayer[]): void {
    const newLayers: UploadFile[] = []
    rendererLayers.forEach((layer) => {
      newLayers.push({
        uid: layer.uid,
        name: layer.name,
        status: 'done',
        percent: 100
      })
    })
    setLayers(newLayers)
  }

  useEffect(() => {
    gerberApp.renderer.then(async (r) => {
      registerLayers(await r.layers)
      // r.addViewportListener(
      //   'childAdded',
      //   Comlink.proxy(async () => {
      //     console.log('childAdded')
      //     // registerLayers(await r.layers)
      //   })
      // )
      // r.addViewportListener(
      //   'childRemoved',
      //   Comlink.proxy(async () => {
      //     console.log('childRemoved')
      //     // registerLayers(await r.layers)
      //   })
      // )
    })
    return () => {}
  }, [])

  const props: UploadProps = {
    listType: 'picture',
    multiple: true,
    fileList: layers,
    customRequest: async (options) => {
      const reader = new FileReader()
      if (!options.file) {
        options.onError && options.onError(new Error('No file provided'), options.file)
        messageApi.error(`No file provided`)
        return
      }
      reader.onerror = (err): void => {
        options.onError && options.onError(err, 'Error reading file')
        messageApi.error(`${(options.file as File).name} Error reading file.`)
      }
      reader.onabort = (err): void => {
        options.onError && options.onError(err, 'File read aborted')
        messageApi.error(`${(options.file as File).name} File read aborted.`)
      }
      reader.onprogress = (e): void => {
        const percent = Math.round((e.loaded / e.total) * 100)
        options.onProgress && options.onProgress({ percent })
      }
      reader.onload = async (): Promise<void> => {
        options.onSuccess && options.onSuccess(reader.result)
        // messageApi.success(`${(options.file as File).name} File uploaded successfully.`)
      }

      const file = options.file as Blob
      reader.readAsText(file)
    },
    onChange: async (info) => {
      const { status, uid, name, response } = info.file
      const newFileList = [...info.fileList]
      setLayers(newFileList)
      // type UploadFileStatus = 'error' | 'success' | 'done' | 'uploading' | 'removed';
      if (status === 'done') {
        const renderer = await gerberApp.renderer
        try {
          await renderer.addGerber(name, response, uid)
        } catch (err) {
          messageApi.error(`${name} file upload failed. ${err}`)
          setLayers(layers.filter((l) => l.uid !== uid))
        }
      } else if (status === 'error') {
        messageApi.error(`${name} file upload failed. ${info}`)
        setLayers(layers.filter((l) => l.uid !== uid))
      }
    },
    onRemove: async (file) => {
      const renderer = await gerberApp.renderer
      if (!renderer) return
      await renderer.removeLayer(file.uid)
      setLayers(layers.filter((l) => l.uid !== file.uid))
      return true
    },
    itemRender: (_originNode, file, _fileList, actions) => {
      // console.log('itemRender', file.name)
      return <LayerListItem key={file.uid} file={file} gerberApp={gerberApp} actions={actions} />
    }
  }

  const transparencyCSS = {
    backdropFilter: transparency ? `blur(${blur}px)` : '',
    backgroundColor: transparency
      ? chroma(token.colorBgElevated).alpha(0.7).css()
      : chroma(token.colorBgElevated).css()
  }

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        position: 'fixed',
        pointerEvents: 'none',
        zIndex: 10
      }}
    >
      {contextHolder}
      <Card
        style={{
          width: 200,
          height: '-webkit-fill-available',
          margin: 10,
          pointerEvents: 'all',
          overflow: 'hidden',
          ...transparencyCSS
        }}
        bodyStyle={{ padding: 5, height: '100%', overflow: 'auto' }}
      >
        <Dragger
          key="dragger"
          {...props}
          css={{
            '.ant-upload': {
              height: layers.length > 0 ? '50px' : '100%',
              transitionProperty: 'height',
              transition: 'border-color 0.3s, height 0.5s'
            },
            '.ant-upload .ant-upload-btn': {
              padding: 0
            }
          }}
        >
          <PlusOutlined /> Add Artwork
        </Dragger>
      </Card>
    </div>
  )
}
