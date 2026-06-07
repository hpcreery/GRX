import { Stack, Text, Title } from "@mantine/core"
import type { JSX } from "react"
import { PreviewGallery } from "../components/PreviewGallery"
import { symbolPreviews } from "../docs/previews"

export function SymbolsPage(): JSX.Element {
  return (
    <Stack id="page-content" gap="sm">
      <Title id="symbols" order={1}>
        Symbols
      </Title>
      <Text c="dimmed" size="sm">
        Symbol apertures rendered through the GRX engine. Adjust controls to inspect behavior and generated code.
      </Text>
      <PreviewGallery previews={symbolPreviews} kind="Symbol" />
    </Stack>
  )
}
