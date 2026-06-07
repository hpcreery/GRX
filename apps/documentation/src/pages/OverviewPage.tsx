import { Badge, Box, Button, Card, Group, List, SimpleGrid, Stack, Text, Title } from "@mantine/core"
import { IconArrowRight, IconBook2, IconCode, IconDeviceLaptop, IconForms, IconSparkles } from "@tabler/icons-react"
import type { JSX } from "react"

export function OverviewPage(): JSX.Element {
  return (
    <Stack id="page-content" gap="xl">
      <Stack gap="md">
        <Badge variant="light" size="lg" radius="xl" w="fit-content">
          User guide + developer guide
        </Badge>
        <Title id="overview" order={1} style={{ fontSize: "clamp(2.4rem, 6vw, 4.5rem)", lineHeight: "0.95", letterSpacing: "-0.06em" }}>
          GRX Documentation
        </Title>
        <Text c="dimmed" size="lg" maw={720}>
          Installation, usage, and integration patterns for the viewer and engine with production-ready examples.
        </Text>
        <Group>
          <Button component="a" href="/homepage/" rightSection={<IconArrowRight size={16} />}>
            Open homepage
          </Button>
          <Button component="a" href="#developer-surface" variant="light" leftSection={<IconForms size={16} />}>
            Jump to developer guide
          </Button>
        </Group>
      </Stack>

      <Card withBorder radius="lg" p="lg">
        <Group gap="sm" mb="sm">
          <IconBook2 size={18} />
          <Text fw={600}>What this doc set covers</Text>
        </Group>
        <List spacing="xs" size="sm">
          <List.Item>Install and run GRX locally.</List.Item>
          <List.Item>Navigate and inspect artwork in the viewer.</List.Item>
          <List.Item>Understand engine concepts: project, step, layer, shape.</List.Item>
          <List.Item>Integrate engine rendering into React, Svelte, and Vue.</List.Item>
        </List>
      </Card>

      <SimpleGrid cols={{ base: 1, md: 3 }} spacing="md">
        <Card id="installation" withBorder radius="lg" p="lg">
          <Group gap="sm" align="center">
            <IconDeviceLaptop size={18} />
            <Text fw={600}>Installation</Text>
          </Group>
          <Text c="dimmed" size="sm" mt="sm">
            Install dependencies and run the workspace with pnpm.
          </Text>
          <Box component="pre" mt="md" style={{ margin: 0 }}>{`pnpm install\npnpm dev\npnpm build`}</Box>
        </Card>

        <Card id="using-the-viewer" withBorder radius="lg" p="lg">
          <Group gap="sm" align="center">
            <IconSparkles size={18} />
            <Text fw={600}>Using the viewer</Text>
          </Group>
          <Text c="dimmed" size="sm" mt="sm">
            Load artwork, inspect layers, and navigate geometry with engine-backed views.
          </Text>
          <Box component="pre" mt="md" style={{ margin: 0 }}>{`1. Open GRX\n2. Import artwork\n3. Toggle layers/units\n4. Inspect geometry`}</Box>
        </Card>

        <Card id="developer-surface" withBorder radius="lg" p="lg">
          <Group gap="sm" align="center">
            <IconCode size={18} />
            <Text fw={600}>Developer surface</Text>
          </Group>
          <Text c="dimmed" size="sm" mt="sm">
            {"Engine flow maps to Renderer -> project -> step -> layer -> shape."}
          </Text>
          <Box
            component="pre"
            mt="md"
            style={{ margin: 0 }}
          >{`Renderer -> project -> step -> layer -> shape\n\nEach managed view points at one step.`}</Box>
        </Card>
      </SimpleGrid>
    </Stack>
  )
}
