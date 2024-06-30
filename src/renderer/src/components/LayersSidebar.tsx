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
  Select,
  useMantineTheme
} from '@mantine/core'
import { Dropzone, FileWithPath as FileWithFormat, FileWithPath } from '@mantine/dropzone'
import {
  IconFileX,
  IconFileVector,
  IconContrast,
  IconContrastOff,
  IconClearAll
} from '@tabler/icons-react'
import LayerListItem from './sidebar/LayerListItem'
import type { LayerInfo } from '@src/renderer/engine'
import * as Comlink from 'comlink'

import { pluginList } from '@src/renderer/plugins'
import { EngineEvents } from '@src/renderer/engine'
import { useContextMenu } from 'mantine-contextmenu'

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
  const [renderID, setRenderID] = useState<number>(0)
  const [deleteConfirmModalOpen, setDeleteConfirmModalOpen] = useState<boolean>(false)
  const { showContextMenu } = useContextMenu()
  const theme = useMantineTheme()

  function registerLayers(
    rendererLayers: LayerInfo[],
    loadingLayers: { name: string; uid: string }[]
  ): void {
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

  function identifyFileType(file: FileWithPath): string {
    const defaultFormat = 'rs274x'
    const extension = file.name.split('.').pop()?.toLowerCase()

    if (!extension) return defaultFormat
    if (['gds', 'gdsii', 'gds2'].includes(extension)) return 'gdsii'
    if (['gbr', 'geb', 'gerber', 'drl'].includes(extension)) return 'rs274x'
    if (['dxf'].includes(extension)) return 'dxf'
    return defaultFormat
  }
  async function uploadFiles(files: FileWithFormat[]): Promise<void> {
    setFiles(
      files.map((file) => Object.assign(file, { format: identifyFileType(file), uid: UID() }))
    )
  }

  async function confirmFiles(files: UploadFile[]): Promise<void> {
    setLayers([...layers, ...files])
    setFiles([])
  }

  async function deleteAllLayers(): Promise<void> {
    layers.forEach(async (layer) => {
      const backend = await renderEngine.backend
      if (!backend) return
      await backend.removeLayer(layer.uid)
      setLayers([])
      setRenderID(0)
    })
  }

  useEffect(() => {
    renderEngine.backend.then(async (backend) => {
      const reg = async (): Promise<void> => {
        renderEngine.zoomFit()
        return registerLayers(await backend.getLayers(), await backend.layersQueue)
      }
      reg()
      backend.addEventCallback(EngineEvents.LAYERS_CHANGED, Comlink.proxy(reg))
    })
  }, [])

  const closeDeleteConfirmModal = (): void => {
    setDeleteConfirmModalOpen(false)
  }

  const openDeleteConfirmModal = (): void => {
    setDeleteConfirmModalOpen(true)
  }

  const actions = {
    download: (): void => { },
    preview: (): void => { },
    remove: async (file: UploadFile): Promise<void> => {
      const backend = await renderEngine.backend
      if (!backend) return
      await backend.removeLayer(file.uid)
      setLayers(layers.filter((l) => l.uid !== file.uid))
      return
    },
    hideAll: (): void => {
      layers.forEach(async (layer) => {
        const backend = await renderEngine.backend
        if (!backend) return
        await backend.setLayerProps(layer.uid, { visible: false })
        setRenderID(renderID + 1)
      })
    },
    showAll: (): void => {
      layers.forEach(async (layer) => {
        const backend = await renderEngine.backend
        if (!backend) return
        await backend.setLayerProps(layer.uid, { visible: true })
        setRenderID(renderID + 1)
      })
    },
    deleteAll: openDeleteConfirmModal
  }

  const contextItems = [
    {
      title: 'Hide All Layers',
      key: '1',
      icon: <IconContrastOff stroke={1.5} size={18} />,
      onClick: actions.hideAll
    },
    {
      title: 'Show All Layers',
      key: '2',
      icon: <IconContrast stroke={1.5} size={18} />,
      onClick: actions.showAll
    },
    {
      title: 'Delete All Layers',
      key: '3',
      icon: <IconClearAll stroke={1.5} size={18} style={{ color: theme.colors.red[7] }} />,
      onClick: actions.deleteAll
    }
  ]

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
      <Modal
        opened={files.length > 0}
        onClose={(): void => setFiles([])}
        title="Layer Identification"
      >
        <Stack>
          {files.map((file) => (
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
          ))}
          {files.length > 0 && (
            <Button onClick={(): Promise<void> => confirmFiles(files)}>Open</Button>
          )}
        </Stack>
      </Modal>
      <Modal opened={deleteConfirmModalOpen} onClose={closeDeleteConfirmModal} title="Confirm Delete All">
        <Text>Are you sure you want to delete all layers?</Text>
        <Group mt={10}>
          {/* <Button onClick={closeDeleteConfirmModal} variant="default" fullWidth>
            Cancel
          </Button> */}
          <Button onClick={() => {
            deleteAllLayers()
            setDeleteConfirmModalOpen(false)
          }} color="red" fullWidth>
            Delete
          </Button>
        </Group>
      </Modal>
      <Dropzone.FullScreen active={true} multiple={true} onDrop={uploadFiles}>
        <Group mih={220} style={{ zIndex: 40 }}>
          <Dropzone.Accept>
            <IconFileVector size="3.2rem" stroke={1.5} />
          </Dropzone.Accept>
          <Dropzone.Reject>
            <IconFileX size="3.2rem" stroke={1.5} />
          </Dropzone.Reject>
          <Dropzone.Idle>
            <IconFileVector size="3.2rem" stroke={1.5} />
          </Dropzone.Idle>

          <div>
            <Text size="xl" inline>
              Drag artwork here or click to select files
            </Text>
            <Text size="sm" color="dimmed" inline mt={7}>
              Attach as many files as you like
            </Text>
          </div>
        </Group>
      </Dropzone.FullScreen>
      <Card
        onContextMenu={showContextMenu(contextItems)}
        radius="md"
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
        padding={4}
      >
        <ScrollArea
          className="scroll-area-sidebar"
          type="scroll"
          scrollbars="y"
          h={'100%'}
          w={'100%'}
        >
          <Group grow pb={5}>
            <FileButton onChange={uploadFiles} accept="*" multiple>
              {(props): JSX.Element => (
                <Button variant="default" {...props} radius="sm">
                  Upload Artwork
                </Button>
              )}
            </FileButton>
          </Group>
          <Stack
            justify="flex-start"
            style={{
              '--stack-gap': '2px'
            }}
          >
            {layers.map((layer) => (
              <LayerListItem
                key={layer.uid + renderID}
                file={layer}
                renderEngine={renderEngine}
                actions={actions}
              />
            ))}
          </Stack>

          {/* {layers.length > 0 && (
            <Group grow pt={5}>
              <Button
                color="red"
                radius="sm"
                rightSection={<IconClearAll size={14} />}
                onClick={() => deleteAllLayers()}
              >
                Delete All
              </Button>
            </Group>
          )} */}
        </ScrollArea>
      </Card>
    </div>
  )
}
