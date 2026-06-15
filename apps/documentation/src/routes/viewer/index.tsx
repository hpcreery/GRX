import { Badge, Card, Stack, Text, Title } from "@mantine/core"
import { createFileRoute } from "@tanstack/react-router"
import type { JSX } from "react"

export const Route = createFileRoute("/viewer/")({
  component: ViewerPage,
})

export function ViewerPage(): JSX.Element {
  return (
    <Stack id="page-content" gap="md">
      <Title id="viewer" order={1}>
        Viewer route placeholder
      </Title>
      <Card withBorder radius="lg" p="lg">
        <Text c="dimmed" size="sm">
          This section is reserved for viewer-focused documentation. You can replace this placeholder with viewer onboarding, controls, and workflow
          content.
        </Text>
      </Card>
    </Stack>
  )
}
