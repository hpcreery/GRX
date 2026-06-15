import { Stack, Title } from "@mantine/core"
import { createFileRoute } from "@tanstack/react-router"
import type { JSX } from "react"

export const Route = createFileRoute("/engine/")({
  component: OverviewPage,
})

export function OverviewPage(): JSX.Element {
  return (
    <Stack id="page-content" gap="xl">
      <Stack gap="md">
        <Title id="overview" order={1}>
          GRX Engine Documentation
        </Title>
      </Stack>
    </Stack>
  )
}
