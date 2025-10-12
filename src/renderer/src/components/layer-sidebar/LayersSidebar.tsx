import { useEffect, useState, useContext } from "react"
import { Card, Group, Text, Button, FileButton, Stack, ScrollArea, Modal, Select, useMantineTheme } from "@mantine/core"
import { Dropzone, FileWithPath } from "@mantine/dropzone"
import { IconFileX, IconFileVector, IconContrast, IconContrastOff, IconClearAll } from "@tabler/icons-react"
import LayerListItem from "./LayerListItem"
// import type { LayerInfo } from "@src/renderer/engine/engine"
import * as Comlink from "comlink"
import { notifications } from "@mantine/notifications"

import { importFormatList, importFormats } from "@src/renderer/data/import-plugins"
// import { EngineEvents } from "@src/renderer/engine/engine"
import { useContextMenu } from "mantine-contextmenu"
import { EditorConfigProvider } from "@src/contexts/EditorContext"

import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core"
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { restrictToVerticalAxis } from "@dnd-kit/modifiers"

import { Resizable } from "re-resizable"

import { useLocalStorage } from "@mantine/hooks"

import { Renderer, DataInterface } from "@src/renderer"

import type { importFormatName } from "@src/renderer/data/import-plugins"

// const UID = (): string => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)

interface SidebarProps {}

export interface UploadFile extends FileWithPath {
  format: importFormatName
  id: string
}

export default function LayerSidebar(_props: SidebarProps): JSX.Element | null {
  const { renderer } = useContext(EditorConfigProvider)
  const [layers, setLayers] = useState<string[]>([])
  const [files, setFiles] = useState<UploadFile[]>([])
  const [renderID, setRenderID] = useState<number>(0)
  const [deleteConfirmModalOpen, setDeleteConfirmModalOpen] = useState<boolean>(false)
  const { showContextMenu } = useContextMenu()
  const theme = useMantineTheme()
  const [layerSidebarWidth, setLayerSidebarWidth] = useLocalStorage<number>({
    key: "layerSidebarWidth",
    defaultValue: 220,
  })


  function identifyFileType(file: FileWithPath): string {
    const defaultFormat = importFormatList[0]

    const extension = file.name.split(".").pop()?.toLowerCase()
    if (!extension) return defaultFormat
    for (const plugin in importFormats) {
      if (importFormats[plugin].matchFile(extension)) return plugin
    }
    return defaultFormat
  }

  async function uploadFiles(files: FileWithPath[]): Promise<void> {
    setFiles(files.map((file) => Object.assign(file, { format: identifyFileType(file), id: file.name }) as UploadFile))
  }

  async function confirmFiles(files: UploadFile[]): Promise<void> {
    // setLayers([...layers, ...files])
    files.forEach((file) => openFile(file))
    setFiles([])
  }

  async function deleteAllLayers(): Promise<void> {
    layers.forEach(async (layer) => {
      const engine = await renderer.engine
      if (!engine) return
      // await engine.removeLayer("main", layer.id)
      await DataInterface.delete_layer("main", layer)
      setLayers(await DataInterface.read_layers("main"))
      setRenderID(0)
    })
  }

  useEffect(() => {
    const reg = async (): Promise<void> => {
      // console.log("registeringLayers")
      renderer.engine.then((engine) => engine.zoomFit("main"))
      return setLayers(await DataInterface.read_layers("main"))
    }
    reg()
    // renderer.engine.then(async (engine) => {
    //   // engine.addEventCallback("main", EngineEvents.LAYERS_CHANGED, Comlink.proxy(reg))
    // })
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
    remove: async (layer: string): Promise<void> => {
      const engine = await renderer.engine
      if (!engine) return
      await DataInterface.delete_layer("main", layer)
      setLayers(await DataInterface.read_layers("main"))
      return
    },
    hideAll: (): void => {
      layers.forEach(async (layer) => {
        const engine = await renderer.engine
        if (!engine) return
        await engine.setLayerVisibility("main", layer, false)
        setRenderID(renderID + 1)
      })
    },
    showAll: (): void => {
      layers.forEach(async (layer) => {
        const engine = await renderer.engine
        if (!engine) return
        await engine.setLayerVisibility("main", layer, true)
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
      renderer.engine.then(async (engine) => {
        const oldIndex = layers.findIndex((item) => item === active.id)
        const newIndex = layers.findIndex((item) => item === over.id)
        // TODO: implement layer reordering in data interface
        // await engine.moveLayer("main", oldIndex, newIndex)
        // await DataInterface.move_layer("main", oldIndex, newIndex)
      })
      DataInterface.read_layers("main").then((updatedLayers) => setLayers(updatedLayers))
    }
  }

  function openFile(file: UploadFile): void {

      const reader = new FileReader()
      reader.onerror = (err): void => {
        console.error(err, `${file.name} Error reading file.`)
        notifications.show({
          title: "Error reading file",
          message: `${file.name} Error reading file.`,
          color: "red",
          autoClose: 5000,
        })
      }
      reader.onabort = (err): void => {
        console.warn(err, `${file.name} File read aborted.`)
        notifications.show({
          title: "File read aborted",
          message: `${file.name} File read aborted.`,
          color: "red",
          autoClose: 5000,
        })
      }
      reader.onprogress = (e): void => {
        const percent = Math.round((e.loaded / e.total) * 100)
        console.info(`${file.name} ${percent}% read`)
      }
      reader.onload = async (_e): Promise<void> => {
        if (reader.result !== null && reader.result !== undefined) {
          try {
            // console.time(`${file.name} file parse time`)
            await DataInterface.create_layer("main", file.id)
            await DataInterface._import_file(Comlink.transfer(reader.result as ArrayBuffer, [reader.result as ArrayBuffer]), file.format, {
              project: "main",
              step: "main",
              layer: file.id,
            })
            setLayers(await DataInterface.read_layers("main"))
            // console.timeEnd(`${file.name} file parse time`)
            // notifications.show({
            //   title: 'File read',
            //   message: `${file.name} file read.`,
            //   color: 'green',
            //   autoClose: 5000
            // })
          } catch (fileParseError) {
            console.error(fileParseError)
            notifications.show({
              title: "File parse error",
              message: `${file.name} file parse error.`,
              color: "red",
              autoClose: 5000,
            })
          }
        } else {
          notifications.show({
            title: "File upload failed",
            message: `${file.name} file upload failed.`,
            color: "red",
            autoClose: 5000,
          })
        }
      }
      reader.readAsArrayBuffer(file)
    // })
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
              data={importFormatList}
              defaultValue={file.format}
              comboboxProps={{ shadow: "md" }}
              onChange={(value): void => {
                if (!value) return
                files.find((f) => f.id === file.id)!.format = value as importFormatName
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
      <Resizable
        defaultSize={{
          width: 220,
          height: "100%",
        }}
        size={{
          width: layerSidebarWidth,
          height: "100%",
        }}
        onResizeStop={(_e, _direction, _ref, d) => {
          setLayerSidebarWidth(layerSidebarWidth + d.width)
        }}
        minWidth={200}
        maxWidth={500}
        enable={{
          top: false,
          right: true,
          bottom: false,
          left: false,
          topRight: false,
          bottomRight: false,
          bottomLeft: false,
          topLeft: false,
        }}
        style={{
          pointerEvents: "all",
        }}
      >
        <Card
          onContextMenu={showContextMenu(contextItems)}
          radius="md"
          withBorder
          style={{
            width: "-webkit-fill-available",
            height: "-webkit-fill-available",
            margin: 10,
            marginRight: 0,
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
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd} modifiers={[restrictToVerticalAxis]}>
                <SortableContext items={layers} strategy={verticalListSortingStrategy}>
                  {layers.map((layer) => (
                    <LayerListItem key={layer + renderID} layer={layer} actions={actions} />
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
      </Resizable>
    </div>
  )
}
