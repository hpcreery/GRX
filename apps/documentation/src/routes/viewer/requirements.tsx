import { Box, Button, Card, List, Stack, Text, Title } from "@mantine/core"
import { IconBrandGithub, IconDownload, IconTerminal } from "@tabler/icons-react"
import { createFileRoute } from "@tanstack/react-router"
import type { JSX } from "react"

export const Route = createFileRoute("/viewer/requirements")({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <Stack id="page-content" gap="md">
      <Title id="system-requirements" order={1}>
        System Requirements
      </Title>

      <Text c="dimmed" size="sm">
        Install GRX using the latest desktop release or run it locally from source.
      </Text>

      <Title id="web-system-requirements" order={2} mb="xs">
        Browser Requirements
      </Title>
      <Text c="dimmed" size="sm" mb="md">
        For the best experience, use the latest version of a modern web browser. GRX relies on WebGL 2.0 for rendering, so ensure your browser
        supports this technology.
      </Text>
      <Title id="minimum-system-requirements" order={2} mb="xs">
        Minimum System Requirements
      </Title>
      <Text c="dimmed" size="sm" mb="md">
        Ensure your system meets the following minimum requirements for optimal performance.
      </Text>

      <List spacing="xs" size="sm" mb="md">
        <List.Item>Operating System: Windows 10/11, macOS 10.15+, or Linux (Ubuntu 20.04+)</List.Item>
        <List.Item>CPU: Quad-core processor</List.Item>
        <List.Item>RAM: 4 GB (8 GB recommended)</List.Item>
        <List.Item>GPU: OpenGL 1.0 compatible graphics card</List.Item>
        <List.Item>Storage: At least 500 MB of free disk space for installation</List.Item>
      </List>
    </Stack>
  )
}
