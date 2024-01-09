import { useEffect, useState } from 'react'
import VirtualGerberApplication from '../renderer/virtual'
import {
  Card,
  Group,
  Text,
  useMantineTheme,
  Button,
  FileButton,
  Stack,
  ScrollArea
} from '@mantine/core'
import { Dropzone } from '@mantine/dropzone'
import { IconFileX, IconFileVector } from '@tabler/icons-react'
import LayerListItem from './sidebar/LayerListItem'
import { TRendererLayer } from '@renderer/renderer/types'

const UID = (): string =>
  Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)

interface SidebarProps {
  gerberApp: VirtualGerberApplication
}

export interface UploadFile extends File {
  uid: string
}

export default function LayerSidebar({ gerberApp }: SidebarProps): JSX.Element | null {
  const theme = useMantineTheme()
  const [layers, setLayers] = useState<UploadFile[]>([])

  function registerLayers(rendererLayers: TRendererLayer[]): void {
    const newLayers: UploadFile[] = []
    rendererLayers.forEach(async (layer) => {
      const file = new File([], layer.name)
      const newfile: UploadFile = Object.assign(file, { uid: layer.uid })
      newLayers.push(newfile)
    })
    setLayers(newLayers)
  }

  async function uploadFiles(files: File[]): Promise<void> {
    console.log('uploadFiles')
    const newLayers = [...layers]
    files.forEach(async (file) => {
      const uid = UID()
      const newfile: UploadFile = Object.assign(file, { uid })
      newLayers.push(newfile)
    })
    setLayers(newLayers)
  }

  useEffect(() => {
    gerberApp.renderer.then(async (r) => {
      registerLayers(await r.layers)
    })
    return () => {}
  }, [])

  const actions = {
    download: (): void => {},
    preview: (): void => {},
    remove: async (file: UploadFile): Promise<void> => {
      const renderer = await gerberApp.renderer
      if (!renderer) return
      await renderer.removeLayer(file.uid)
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
      <Dropzone.FullScreen active={true} multiple={true} onDrop={uploadFiles}>
        <Group
          position="center"
          spacing="xl"
          mih={220}
          // sx={{ pointerEvents: 'none' }}
          style={{ zIndex: 40 }}
        >
          <Dropzone.Accept>
            <IconFileVector
              size="3.2rem"
              stroke={1.5}
              color={theme.colors[theme.primaryColor][theme.colorScheme === 'dark' ? 4 : 6]}
            />
          </Dropzone.Accept>
          <Dropzone.Reject>
            <IconFileX
              size="3.2rem"
              stroke={1.5}
              color={theme.colors.red[theme.colorScheme === 'dark' ? 4 : 6]}
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
        radius="12px"
        withBorder
        style={{
          width: 220,
          height: '-webkit-fill-available',
          margin: 10,
          pointerEvents: 'all',
          overflowY: 'auto',
          overflowX: 'hidden'
        }}
        className={'transparency'}
        padding={5}
      >
        <ScrollArea
          // offsetScrollbars
          type="scroll"
          h={'100%'}
          viewportProps={{
            style: {
              overflowX: 'hidden'
              // overflowY: 'auto',
              // width: '100%'
              // display: 'block'
            }
          }}
          // styles={{
          //   viewport: {
          //     '&& > div': {
          //       display: 'block !important'
          //     }
          //   }
          // }}
        >
          <Group position="center" grow pb={5}>
            <FileButton onChange={uploadFiles} accept="*" multiple>
              {(props): JSX.Element => (
                <Button variant="default" {...props}>
                  Upload Gerbers
                </Button>
              )}
            </FileButton>
          </Group>
          <Stack justify="flex-start" spacing="0px">
            {layers.map((layer) => (
              <LayerListItem key={layer.uid} file={layer} gerberApp={gerberApp} actions={actions} />
            ))}
          </Stack>
        </ScrollArea>
      </Card>
    </div>
  )
}
