import { ActionIcon, AppShell, Box, Burger, Group, NavLink, ScrollArea, Stack, TableOfContents, Text, Title } from "@mantine/core"
import { useDisclosure } from "@mantine/hooks"
import { IconBook2, IconBrackets, IconBrandGithub, IconComponents, IconForms } from "@tabler/icons-react"
import type { JSX } from "react"
import { useEffect, useMemo, useRef, useState } from "react"
import { IntegrationPage } from "./pages/IntegrationPage"
import { OverviewPage } from "./pages/OverviewPage"
import { ShapesPage } from "./pages/ShapesPage"
import { SymbolsPage } from "./pages/SymbolsPage"
import icon from "../resources/icons/32x32.png"
import classes from "./TableOfContents.module.css"

type PageKey = "overview" | "symbols" | "shapes" | "integration"

type PageConfig = {
  key: PageKey
  label: string
  description: string
  icon: JSX.Element
  component: JSX.Element
}

const pages: PageConfig[] = [
  {
    key: "overview",
    label: "Overview",
    description: "Install and viewer basics",
    icon: <IconBook2 size={16} />,
    component: <OverviewPage />,
  },
  {
    key: "symbols",
    label: "Symbols",
    description: "Symbol apertures",
    icon: <IconComponents size={16} />,
    component: <SymbolsPage />,
  },
  {
    key: "shapes",
    label: "Shapes",
    description: "Primitive and composite shapes",
    icon: <IconForms size={16} />,
    component: <ShapesPage />,
  },
  {
    key: "integration",
    label: "Integration",
    description: "React, Svelte, Vue",
    icon: <IconBrackets size={16} />,
    component: <IntegrationPage />,
  },
]

export default function App(): JSX.Element {
  const [opened, { toggle, close }] = useDisclosure(false)
  const [activePage, setActivePage] = useState<PageKey>("overview")
  const reinitializeRef = useRef<() => void>(() => {})

  const pageConfig = useMemo(() => pages.find((page) => page.key === activePage) ?? pages[0], [activePage])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" })
    reinitializeRef.current()
  }, [activePage])

  const navItems = pages.map((page) => (
    <NavLink
      key={page.key}
      active={page.key === activePage}
      label={page.label}
      description={page.description}
      leftSection={page.icon}
      onClick={() => {
        setActivePage(page.key)
        close()
      }}
    />
  ))
  console.log("classes", classes)

  return (
    <AppShell
      padding="md"
      layout="default"
      header={{ height: 80 }}
      navbar={{ width: 300, breakpoint: "md", collapsed: { mobile: !opened } }}
      aside={{ width: 280, breakpoint: "md", collapsed: { mobile: true, desktop: false } }}
    >
      <AppShell.Header>
        <Group h="100%" px="xl" justify="space-between" wrap="nowrap">
          <Group gap="md" wrap="nowrap" px="xl">
            <Burger opened={opened} onClick={toggle} hiddenFrom="md" size="sm" />
            <img src={icon} alt="GRX Docs" />
            <Title order={2}>GRX Docs</Title>
          </Group>

          <Group gap="md" wrap="nowrap" px="xl">
            {/* <Anchor href="/homepage/" c="dimmed" underline="never" visibleFrom="sm">
              Homepage
            </Anchor>
            <UnstyledButton>
              <Anchor href="/homepage/" underline="never">
                <Group gap={6} wrap="nowrap">
                  <IconHome2 size={14} />
                  <Text size="sm">Back to GRX</Text>
                </Group>
              </Anchor>
            </UnstyledButton> */}
            <ActionIcon variant="transparent" aria-label="GitHub" component="a" href="https://github.com/hpcreery/GRX" target="_blank">
              <IconBrandGithub size={18} />
            </ActionIcon>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar>
        <AppShell.Section>
          <Text fw={600} size="sm" px="sm" pt="sm" pb="sm">
            Pages
          </Text>
        </AppShell.Section>

        <AppShell.Section component={ScrollArea} grow>
          {navItems}
        </AppShell.Section>
      </AppShell.Navbar>

      <AppShell.Aside visibleFrom="md">
        <AppShell.Section>
          <Text fw={600} size="sm" px="sm" pt="xs" pb="sm">
            On this page
          </Text>
        </AppShell.Section>

        <AppShell.Section component={ScrollArea} grow>
          <Box id="toc-container">
            <TableOfContents
              reinitializeRef={reinitializeRef}
              variant="none"
              size="sm"
              radius="0"
              scrollSpyOptions={{
                selector: "#page-content :is(h1, h2, h3)",
              }}
              getControlProps={({ data }) => ({
                // onClick: () => data.getNode().scrollIntoView(),
                component: "a",
                href: `#${data.id}`,
                children: data.value,
              })}
              classNames={classes}
              // style={{
              //   ":where([data-active])": {
              //     color: "var(--toc-color)",
              //   },
              // }}
              // styles={{
              //   control: {
              //     ":where([data-active])": {
              //       color: "red",
              //     },
              //     // fontWeight: 500,
              //     // color: "white",
              //   }
              // }}
            />
          </Box>
        </AppShell.Section>
      </AppShell.Aside>

      <AppShell.Main className="main">
        <Stack gap="lg" mx="auto" maw={1000}>
          {pageConfig.component}
        </Stack>
      </AppShell.Main>
    </AppShell>
  )
}
