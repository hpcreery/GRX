import { Stack, Text, Title } from "@mantine/core"
import type { JSX } from "react"
import { PreviewGallery } from "../components/PreviewGallery"
import { shapePreviews } from "../docs/previews"

export function ShapesPage(): JSX.Element {
  return (
    <Stack id="page-content" gap="sm">
      <Title id="shapes" order={1}>
        Shapes
      </Title>
      <Text c="dimmed" size="sm">
        Primitive and composite shapes that power GRX rendering. Controls update live geometry and code snippets.
      </Text>
      <PreviewGallery previews={shapePreviews} kind="Shape" />
    </Stack>
  )
}
