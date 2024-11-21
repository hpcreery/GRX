import { useEffect, useState, useContext } from "react"
import { Card, Group, Text, Button, FileButton, Stack, ScrollArea, Modal, Select, useMantineTheme } from "@mantine/core"
import { Dropzone, FileWithPath as FileWithFormat, FileWithPath } from "@mantine/dropzone"
import { IconFileX, IconFileVector, IconContrast, IconContrastOff, IconClearAll } from "@tabler/icons-react"
import LayerListItem from "./LayerListItem"
import type { LayerInfo } from "@src/renderer/engine"
import * as Comlink from "comlink"

import { pluginList, plugins } from "@src/renderer/plugins"
import { EngineEvents } from "@src/renderer/engine"
import { useContextMenu } from "mantine-contextmenu"
import { EditorConfigProvider } from "@src/contexts/EditorContext"

import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core"
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { restrictToVerticalAxis, restrictToParentElement } from "@dnd-kit/modifiers"

const UID = (): string => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)

interface SidebarProps {}

export interface UploadFile extends FileWithFormat {
  format: string
  id: string
}

export default function LayerSidebar(_props: SidebarProps): JSX.Element | null {
  const { renderEngine } = useContext(EditorConfigProvider)
  const [layers, setLayers] = useState<UploadFile[]>([])
  const [files, setFiles] = useState<UploadFile[]>([])
  const [renderID, setRenderID] = useState<number>(0)
  const [deleteConfirmModalOpen, setDeleteConfirmModalOpen] = useState<boolean>(false)
  const { showContextMenu } = useContextMenu()
  const theme = useMantineTheme()

  function registerLayers(rendererLayers: LayerInfo[], loadingLayers: { name: string; id: string }[]): void {
    const newLayers: UploadFile[] = []
    rendererLayers.forEach(async (layer) => {
      const file = new File([], layer.name)
      const newfile: UploadFile = Object.assign(file, { id: layer.uid, format: layer.format })
      newLayers.push(newfile)
    })
    loadingLayers.forEach(async (layer) => {
      const file = new File([], layer.name)
      const newfile: UploadFile = Object.assign(file, { id: layer.id, format: "" })
      newLayers.push(newfile)
    })
    setLayers(newLayers)
  }

  function identifyFileType(file: FileWithPath): string {
    const defaultFormat = pluginList[0]

    const extension = file.name.split(".").pop()?.toLowerCase()
    if (!extension) return defaultFormat
    for (const plugin in plugins) {
      if (plugins[plugin].matchFile(extension)) return plugin
    }
    return defaultFormat
  }
  async function uploadFiles(files: FileWithFormat[]): Promise<void> {
    setFiles(files.map((file) => Object.assign(file, { format: identifyFileType(file), id: UID() })))
  }

  async function confirmFiles(files: UploadFile[]): Promise<void> {
    setLayers([...layers, ...files])
    setFiles([])
  }

  async function deleteAllLayers(): Promise<void> {
    layers.forEach(async (layer) => {
      const backend = await renderEngine.backend
      if (!backend) return
      await backend.removeLayer(layer.id)
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
    download: (): void => {},
    preview: (): void => {},
    remove: async (file: UploadFile): Promise<void> => {
      const backend = await renderEngine.backend
      if (!backend) return
      await backend.removeLayer(file.id)
      setLayers(layers.filter((l) => l.id !== file.id))
      return
    },
    hideAll: (): void => {
      layers.forEach(async (layer) => {
        const backend = await renderEngine.backend
        if (!backend) return
        await backend.setLayerProps(layer.id, { visible: false })
        setRenderID(renderID + 1)
      })
    },
    showAll: (): void => {
      layers.forEach(async (layer) => {
        const backend = await renderEngine.backend
        if (!backend) return
        await backend.setLayerProps(layer.id, { visible: true })
        setRenderID(renderID + 1)
      })
    },
    deleteAll: openDeleteConfirmModal,
  }

  const contextItems = [
    {
      title: "Hide All Layers",
      key: "1",
      icon: <IconContrastOff stroke={1.5} size={18} />,
      onClick: actions.hideAll,
    },
    {
      title: "Show All Layers",
      key: "2",
      icon: <IconContrast stroke={1.5} size={18} />,
      onClick: actions.showAll,
    },
    {
      title: "Delete All Layers",
      key: "3",
      icon: <IconClearAll stroke={1.5} size={18} color={theme.colors.red[7]} />,
      onClick: actions.deleteAll,
    },
  ]

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  function handleDragEnd(event: DragEndEvent): void {
    const { active, over } = event
    if (over == null) {
      return
    }
    if (active.id !== over.id) {
      renderEngine.backend.then(async (backend) => {
        const oldIndex = layers.findIndex((item) => item.id === active.id)
        const newIndex = layers.findIndex((item) => item.id === over.id)
        await backend.moveLayer(oldIndex, newIndex)
      })
      setLayers((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over.id)
        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        position: "fixed",
        pointerEvents: "none",
        zIndex: 10,
      }}
    >
      <Modal opened={files.length > 0} onClose={(): void => setFiles([])} title="Layer Identification">
        <Stack>
          {files.map((file) => (
            <Select
              key={file.id}
              label={file.name}
              placeholder="Pick value"
              data={pluginList}
              defaultValue={file.format}
              comboboxProps={{ shadow: "md" }}
              onChange={(value): void => {
                if (!value) return
                files.find((f) => f.id === file.id)!.format = value
              }}
            />
          ))}
          {files.length > 0 && <Button onClick={(): Promise<void> => confirmFiles(files)}>Open</Button>}
        </Stack>
      </Modal>
      <Modal opened={deleteConfirmModalOpen} onClose={closeDeleteConfirmModal} title="Confirm Delete All">
        <Text>Are you sure you want to delete all layers?</Text>
        <Group mt={10}>
          {/* <Button onClick={closeDeleteConfirmModal} variant="default" fullWidth>
            Cancel
          </Button> */}
          <Button
            onClick={() => {
              deleteAllLayers()
              setDeleteConfirmModalOpen(false)
            }}
            color="red"
            fullWidth
          >
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
          height: "-webkit-fill-available",
          margin: 10,
          pointerEvents: "all",
          overflowY: "auto",
          overflowX: "hidden",
        }}
        mod={["transparent"]}
        padding={4}
      >
        <ScrollArea className="scroll-area-sidebar" type="scroll" scrollbars="y" h={"100%"} w={"100%"}>
          <Group grow pb={4}>
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
              "--stack-gap": "4px",
            }}
          >
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
              modifiers={[restrictToVerticalAxis, restrictToParentElement]}
            >
              <SortableContext items={layers} strategy={verticalListSortingStrategy}>
                {layers.map((layer) => (
                  <LayerListItem key={layer.id + renderID} file={layer} actions={actions} />
                ))}
              </SortableContext>
            </DndContext>
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
