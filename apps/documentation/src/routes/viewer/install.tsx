import { Box, Button, Card, List, Stack, Text, Title } from "@mantine/core"
import { IconBrandGithub, IconDownload, IconTerminal } from "@tabler/icons-react"
import { createFileRoute } from "@tanstack/react-router"
import type { JSX } from "react"

export const Route = createFileRoute("/viewer/install")({
  component: RouteComponent,
})

export function RouteComponent(): JSX.Element {
  return (
    <Stack id="page-content" gap="md">
      <Title id="installation" order={1}>
        Installation
      </Title>

      <Text c="dimmed" size="sm">
        Install GRX using the latest desktop release or run it locally from source.
      </Text>

      <Card withBorder radius="lg" p="lg">
        <Title id="latest-release" order={2} mb="xs">
          Download the latest release
        </Title>
        <Text c="dimmed" size="sm" mb="md">
          Use the official GitHub Releases page to download the newest build for your platform.
        </Text>
        <Button
          component="a"
          href="https://github.com/hpcreery/GRX/releases"
          target="_blank"
          rel="noreferrer"
          leftSection={<IconDownload size={16} />}
          rightSection={<IconBrandGithub size={16} />}
          w="fit-content"
        >
          Open latest releases
        </Button>
      </Card>

      <Card withBorder radius="lg" p="lg">
        <Title id="from-source" order={2} mb="xs">
          Run from source
        </Title>
        <Text c="dimmed" size="sm" mb="md">
          For development, install prerequisites and run the viewer workspace locally.
        </Text>

        <List spacing="xs" size="sm" mb="md">
          <List.Item>
            Node.js 20+
          </List.Item>
          <List.Item>
            pnpm 10+
          </List.Item>
        </List>

        <Box component="pre" p="md" style={{ margin: 0 }}>
{`pnpm install
pnpm prepare
pnpm run dev

# Desktop (Electron)
pnpm run dev:desktop`}
        </Box>

        <Text c="dimmed" size="xs" mt="md">
          Use <IconTerminal size={14} style={{ verticalAlign: "text-bottom" }} /> the commands above from the workspace root.
        </Text>
      </Card>
    </Stack>
  )
}
