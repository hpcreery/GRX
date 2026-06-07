import { Renderer } from "@grx/engine"
import { CodeHighlight } from "@mantine/code-highlight"
import { Badge, Box, Card, Group, Select, SimpleGrid, Slider, Stack, Tabs, Text, TextInput, Title } from "@mantine/core"
import type { CSSProperties, JSX } from "react"
import { useEffect, useRef, useState } from "react"
import {
  buildShapeCode,
  buildSymbolCode,
  type ControlValue,
  getInitialControlValues,
  layerName,
  type PreviewSpec,
  projectName,
} from "../docs/previews"

const cardStyle: CSSProperties = {
  backdropFilter: "blur(24px)",
  background: "color-mix(in srgb, var(--mantine-color-body) 74%, transparent)",
}

type PreviewGalleryProps = {
  previews: PreviewSpec[]
  kind: "Symbol" | "Shape"
}

export function PreviewGallery({ previews, kind }: PreviewGalleryProps): JSX.Element {
  const engineHostRef = useRef<HTMLDivElement | null>(null)
  const rendererRef = useRef<Renderer | null>(null)
  const previewRefs = useRef(new Map<string, HTMLDivElement>())
  const [ready, setReady] = useState(false)
  const [controlValues, setControlValues] = useState<Record<string, Record<string, ControlValue>>>(() => getInitialControlValues(previews))

  useEffect(() => {
    setControlValues(getInitialControlValues(previews))
  }, [previews])

  useEffect(() => {
    if (!engineHostRef.current) return

    const renderer = new Renderer({ container: engineHostRef.current, attributes: { powerPreference: "high-performance", antialias: false } })
    rendererRef.current = renderer
    renderer.interface.create_project(projectName)
    renderer.interface.create_step(projectName, "default")
    renderer.interface.create_layer(projectName, layerName)

    for (const preview of previews) {
      renderer.interface.create_step(projectName, preview.id)
      const view = previewRefs.current.get(preview.id)
      if (!view) continue

      renderer.addManagedView(view, { project: projectName, step: preview.id })
      renderer.interface.create_step_layer_artwork(projectName, preview.id, layerName, [preview.createShape(controlValues[preview.id] ?? {})])
      renderer.interface.update_view_zoom_fit_artwork(view.id)
    }

    renderer.interface.set_engine_settings({ SHOW_DATUMS: true })
    renderer.onLoad(() => setReady(true))

    return () => {
      renderer.destroy()
      rendererRef.current = null
      setReady(false)
    }
  }, [])

  useEffect(() => {
    const renderer = rendererRef.current
    if (!renderer) return

    for (const preview of previews) {
      renderer.interface.create_step_layer_artwork(projectName, preview.id, layerName, [preview.createShape(controlValues[preview.id] ?? {})])
    }
  }, [controlValues, previews])

  return (
    <Box mt="lg">
      <Group justify="space-between" align="center" mb="md">
        <div>
          <Text fw={600} size="lg">
            {kind} previews
          </Text>
          <Text c="dimmed" size="sm">
            Live previews rendered through GRX engine.
          </Text>
        </div>
        <Badge variant="light">{previews.length} items</Badge>
      </Group>

      <Box ref={engineHostRef} style={{ position: "fixed", inset: 0, zIndex: 1, pointerEvents: "none" }} aria-hidden="true" />

      <SimpleGrid cols={1} spacing="md">
        {previews.map((preview) => {
          const currentValues = controlValues[preview.id] ?? {}
          const codeSnippet = kind === "Symbol" ? buildSymbolCode(preview, currentValues) : buildShapeCode(preview, currentValues)

          return (
            <Card id={preview.id} key={preview.id} withBorder radius="lg" padding="lg" style={cardStyle}>
              <Stack gap="xs">
                <Group justify="space-between" align="flex-start" wrap="nowrap">
                  <div>
                    <Title id={preview.id} order={3} size="h5" m={0}>
                      {preview.title}
                    </Title>
                    <Text size="sm" c="dimmed">
                      {preview.description}
                    </Text>
                  </div>
                  <Badge variant="light">{kind}</Badge>
                </Group>

                <Tabs defaultValue="view" variant="pills" keepMounted>
                  <Tabs.List>
                    <Tabs.Tab value="view">View</Tabs.Tab>
                    <Tabs.Tab value="code">Code</Tabs.Tab>
                  </Tabs.List>

                  <Tabs.Panel value="view" pt="md">
                    <Group align="flex-start" wrap="nowrap" gap="md">
                      <div
                        ref={(node) => {
                          if (node) {
                            previewRefs.current.set(preview.id, node)
                          } else {
                            previewRefs.current.delete(preview.id)
                          }
                        }}
                        style={{
                          position: "relative",
                          minHeight: "20rem",
                          width: "100%",
                          borderRadius: "0.5rem",
                          border: "1px solid color-mix(in srgb, var(--mantine-color-default-border) 60%, transparent)",
                          overflow: "hidden",
                          overscrollBehavior: "contain",
                        }}
                      />

                      <Stack gap="sm" style={{ minWidth: "16rem", maxWidth: "20rem", width: "32%" }}>
                        {Object.values(preview.variables).map((entry) => {
                          const currentValue = controlValues[preview.id]?.[entry.key] ?? entry.value

                          if (entry.type === "combo") {
                            return (
                              <Box key={`${preview.id}-${entry.key}`}>
                                <Text size="xs" c="dimmed" mb={4}>
                                  {entry.label}
                                </Text>
                                <Select
                                  data={entry.options.map((option) => ({ label: option.label, value: String(option.value) }))}
                                  value={String(currentValue)}
                                  allowDeselect={false}
                                  onChange={(value) => {
                                    if (value == null) return
                                    setControlValues((current) => ({
                                      ...current,
                                      [preview.id]: {
                                        ...(current[preview.id] ?? {}),
                                        [entry.key]: Number(value),
                                      },
                                    }))
                                  }}
                                />
                              </Box>
                            )
                          }

                          if (entry.type === "input") {
                            return (
                              <Box key={`${preview.id}-${entry.key}`}>
                                <Text size="xs" c="dimmed" mb={4}>
                                  {entry.label}
                                </Text>
                                <TextInput
                                  value={String(currentValue)}
                                  placeholder={entry.placeholder}
                                  onChange={(event) => {
                                    setControlValues((current) => ({
                                      ...current,
                                      [preview.id]: {
                                        ...(current[preview.id] ?? {}),
                                        [entry.key]: event.currentTarget.value,
                                      },
                                    }))
                                  }}
                                />
                              </Box>
                            )
                          }

                          return (
                            <Box key={`${preview.id}-${entry.key}`}>
                              <Group justify="space-between" mb={4}>
                                <Text size="xs" c="dimmed">
                                  {entry.label}
                                </Text>
                                <Text size="xs" fw={600}>
                                  {Number(currentValue).toFixed(entry.step < 1 ? 1 : 0)}
                                </Text>
                              </Group>
                              <Slider
                                min={entry.min}
                                max={entry.max}
                                step={entry.step}
                                value={Number(currentValue)}
                                onChange={(value) => {
                                  setControlValues((current) => ({
                                    ...current,
                                    [preview.id]: {
                                      ...(current[preview.id] ?? {}),
                                      [entry.key]: value,
                                    },
                                  }))
                                }}
                              />
                            </Box>
                          )
                        })}
                      </Stack>
                    </Group>
                  </Tabs.Panel>

                  <Tabs.Panel value="code" pt="md">
                    <CodeHighlight code={codeSnippet} language="ts" radius="md" />
                  </Tabs.Panel>
                </Tabs>
              </Stack>
            </Card>
          )
        })}
      </SimpleGrid>

      {!ready ? (
        <Text c="dimmed" size="sm" mt="sm">
          Loading engine previews...
        </Text>
      ) : null}
    </Box>
  )
}
