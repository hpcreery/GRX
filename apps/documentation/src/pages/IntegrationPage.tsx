import { CodeHighlight } from "@mantine/code-highlight"
import { Card, Stack, Tabs, Text, Title } from "@mantine/core"
import type { JSX } from "react"
import { frameworkSnippets } from "../docs/previews"

export function IntegrationPage(): JSX.Element {
  return (
    <Stack id="page-content" gap="md">
      <Title id="framework-integration" order={1}>
        Framework integration
      </Title>
      <Text c="dimmed" size="sm">
        The same setup pattern works across frameworks: initialize renderer on mount, create project + step, and destroy on teardown.
      </Text>

      <Card withBorder radius="lg" p="lg">
        <Tabs defaultValue="react" variant="pills" keepMounted={false}>
          <Tabs.List>
            <Tabs.Tab value="react">React</Tabs.Tab>
            <Tabs.Tab value="svelte">Svelte</Tabs.Tab>
            <Tabs.Tab value="vue">Vue</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="react" pt="md">
            <CodeHighlight code={frameworkSnippets.react} language="tsx" radius="md" />
          </Tabs.Panel>

          <Tabs.Panel value="svelte" pt="md">
            <CodeHighlight code={frameworkSnippets.svelte} language="svelte" radius="md" />
          </Tabs.Panel>

          <Tabs.Panel value="vue" pt="md">
            <CodeHighlight code={frameworkSnippets.vue} language="vue" radius="md" />
          </Tabs.Panel>
        </Tabs>
      </Card>
    </Stack>
  )
}
