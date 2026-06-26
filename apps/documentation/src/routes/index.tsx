import { Badge, Button, Group, Stack, Text, Title } from "@mantine/core"
import { IconArrowRight } from "@tabler/icons-react"
import { createFileRoute, Link } from "@tanstack/react-router"
import { Route as EngineRoute } from "./engine"
import { Route as ViewerRoute } from "./viewer"
import type { JSX } from "react"

export const Route = createFileRoute("/")({
  component: OverviewPage,
})

export function OverviewPage(): JSX.Element {
  return (
    <Stack id="page-content" gap="xl">
      <Stack gap="md">
        <Badge variant="light" size="lg" radius="xl" w="fit-content">
          User guide + Engine Documentation
        </Badge>
        <Title id="overview" order={1} style={{ fontSize: "clamp(2.4rem, 6vw, 4.5rem)", lineHeight: "0.95", letterSpacing: "-0.06em" }}>
          GRX Documentation
        </Title>
        <Text c="dimmed" size="lg" maw={720}>
          Installation, usage, and integration patterns for the viewer and engine with production-ready examples.
        </Text>
        <Group>
          <Button component="a" href={EngineRoute.to} rightSection={<IconArrowRight size={16} />}>
            Explore engine docs
          </Button>
          <Button component="a" href={ViewerRoute.to} variant="light" rightSection={<IconArrowRight size={16} />}>
            Explore viewer docs
          </Button>
        </Group>
      </Stack>

    </Stack>
  )
}