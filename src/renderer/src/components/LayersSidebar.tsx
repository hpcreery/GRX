import { useEffect, useState } from 'react'
import { RenderEngine } from '@src/renderer'
import {
  Card,
  Group,
  Text,
  Button,
  FileButton,
  Stack,
  ScrollArea,
  Modal,
  Select
} from '@mantine/core'
import { Dropzone, FileWithPath as FileWithFormat } from '@mantine/dropzone'
import { IconFileX, IconFileVector } from '@tabler/icons-react'
import LayerListItem from './sidebar/LayerListItem'
import type { LayerInfo } from '@src/renderer/engine'
import * as Comlink from 'comlink'

import { pluginList } from '@src/renderer/plugins'

const UID = (): string =>
  Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)

interface SidebarProps {
  renderEngine: RenderEngine
}

export interface UploadFile extends FileWithFormat {
  format: string
  uid: string
}

export default function LayerSidebar({ renderEngine }: SidebarProps): JSX.Element | null {
  const [layers, setLayers] = useState<UploadFile[]>([])
  const [files, setFiles] = useState<UploadFile[]>([])

  function registerLayers(rendererLayers: LayerInfo[], loadingLayers: { name: string, uid: string}[]): void {
    const newLayers: UploadFile[] = []
    rendererLayers.forEach(async (layer) => {
      const file = new File([], layer.name)
      const newfile: UploadFile = Object.assign(file, { uid: layer.uid, format: layer.format })
      newLayers.push(newfile)
    })
    loadingLayers.forEach(async (layer) => {
      const file = new File([], layer.name)
      const newfile: UploadFile = Object.assign(file, { uid: layer.uid, format: '' })
      newLayers.push(newfile)
    })
    setLayers(newLayers)
  }

  async function uploadFiles(files: FileWithFormat[]): Promise<void> {
    setFiles(files.map((file) => Object.assign(file, { format: 'rs274x', uid: UID() })))
  }

  async function confirmFiles(files: UploadFile[]): Promise<void> {
    setLayers([...layers, ...files])
    setFiles([])
  }

  useEffect(() => {
    renderEngine.backend.then(async backend => {
      const reg = async (): Promise<void> => registerLayers(await backend.getLayers(), await backend.layersQueue)
      reg()
      backend.addEventCallback('LAYER_ADDED', Comlink.proxy(reg))
    })
  }, [])

  const actions = {
    download: (): void => { },
    preview: (): void => { },
    remove: async (file: UploadFile): Promise<void> => {
      const backend = await renderEngine.backend
      if (!backend) return
      await backend.removeLayer(file.uid)
      setLayers(layers.filter((l) => l.uid !== file.uid))
      return
    }
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
      <Modal opened={files.length > 0} onClose={(): void => setFiles([])} title="Layer Intentification">
        <Stack>
          {
            files.map((file) => (
              <Select
                key={file.uid}
                label={file.name}
                placeholder="Pick value"
                data={pluginList}
                defaultValue={file.format}
                comboboxProps={{ shadow: 'md' }}
                onChange={(value): void => {
                  if (!value) return
                  files.find((f) => f.uid === file.uid)!.format = value
                }}
              />
            ))
          }
          {
            files.length > 0 && (
              <Button onClick={(): Promise<void> => confirmFiles(files)}>Open</Button>
            )
          }
        </Stack>
      </Modal>
      <Dropzone.FullScreen active={true} multiple={true} onDrop={uploadFiles}>
        <Group
          mih={220}
          style={{ zIndex: 40 }}
        >
          <Dropzone.Accept>
            <IconFileVector
              size="3.2rem"
              stroke={1.5}
            />
          </Dropzone.Accept>
          <Dropzone.Reject>
            <IconFileX
              size="3.2rem"
              stroke={1.5}
            />
          </Dropzone.Reject>
          <Dropzone.Idle>
            <IconFileVector size="3.2rem" stroke={1.5} />
          </Dropzone.Idle>

          <div>
            <Text size="xl" inline>
              Drag gerbers here or click to select files
            </Text>
            <Text size="sm" color="dimmed" inline mt={7}>
              Attach as many files as you like
            </Text>
          </div>
        </Group>
      </Dropzone.FullScreen>
      <Card
        // radius="12px"
        radius='md'
        withBorder
        style={{
          width: 220,
          height: '-webkit-fill-available',
          margin: 10,
          pointerEvents: 'all',
          overflowY: 'auto',
          overflowX: 'hidden'
        }}
        mod={['transparent']}
        padding={5}
      >
        <ScrollArea

          className='scroll-area-sidebar'
          type="scroll"
          scrollbars="y"
          h={'100%'}
          w={'100%'}
        >
          <Group grow pb={5}>
            <FileButton onChange={uploadFiles} accept="*" multiple>
              {(props): JSX.Element => (
                <Button variant="default" {...props} radius='sm'>
                  Upload Artwork
                </Button>
              )}
            </FileButton>
          </Group>
          <Stack justify="flex-start" style={{
            '--stack-gap': '2px'
          }}>
            {layers.map((layer) => (
              <LayerListItem key={layer.uid} file={layer} renderEngine={renderEngine} actions={actions} />
            ))}
          </Stack>
        </ScrollArea>
      </Card>
    </div>
  )
}
