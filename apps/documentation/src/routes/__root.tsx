import {
  ActionIcon,
  AppShell,
  Autocomplete,
  Box,
  Burger,
  Button,
  Group,
  NavLink,
  ScrollArea,
  Stack,
  TableOfContents,
  Text,
  Title,
  useMantineColorScheme,
} from "@mantine/core"
import { useDisclosure } from "@mantine/hooks"
import { IconBook2, IconBrackets, IconBrandGithub, IconComponents, IconForms, IconSearch, IconDownload, IconMoon, IconSun } from "@tabler/icons-react"
import { createRootRoute, Link, Outlet, useNavigate, useRouter, useRouterState } from "@tanstack/react-router"
import type { JSX } from "react"
import { useEffect, useRef } from "react"
import icon from "../../resources/icons/32x32.png"
import AppShellClasses from "../styles/AppShell.module.css"
import classes from "../styles/HeaderSearch.module.css"
import NavLinkClasses from "../styles/Navlink.module.css"
import TableOfContentsClasses from "../styles/TableOfContents.module.css"
import { Route as ViwerRoute } from "./viewer"
import { Route as EngineRoute } from "./engine"
import { Route as EngineShapesRoute } from "./engine/shapes"
import { Route as EngineSymbolsRoute } from "./engine/symbols"
import { Route as EngineIntegrationRoute } from "./engine/integration"
import { Route as ViewerInstallRoute } from "./viewer/install"

export const Route = createRootRoute({
  component: App,
})

type PageConfig = {
  key: string
  to: string
  label: string
  description: string
  icon: JSX.Element
}

type HeaderLink = {
  to: string
  label: string
  pages: PageConfig[]
}

const headerLinks: HeaderLink[] = [
  { to: "/viewer", label: "Viewer", pages: [
    {
      key: "viewer-overview",
      to: ViwerRoute.to,
      label: "Overview",
      description: "",
      icon: <IconBook2 size={16} />,
    },
    {
      key: "viewer-install",
      to: ViewerInstallRoute.to,
      label: "Installation",
      description: "How to install and use the viewer",
      icon: <IconDownload size={16} />,
    },
  ] },
  {
    to: "/engine",
    label: "Engine",
    pages: [
      {
        key: "developer-overview",
        to: EngineRoute.to,
        label: "Overview",
        description: "",
        icon: <IconBook2 size={16} />,
      },
      {
        key: "symbols",
        to: EngineSymbolsRoute.to,
        label: "Symbols",
        description: "Symbol Apertures",
        icon: <IconComponents size={16} />,
      },
      {
        key: "shapes",
        to: EngineShapesRoute.to,
        label: "Shapes",
        description: "Primitive and Composite shapes",
        icon: <IconForms size={16} />,
      },
      {
        key: "integration",
        to: EngineIntegrationRoute.to,
        label: "Integration",
        description: "Developer Implementation Guide",
        icon: <IconBrackets size={16} />,
      },
    ],
  },
]

export default function App(): JSX.Element {
  const [opened, { toggle, close }] = useDisclosure(false)
  const { colorScheme, toggleColorScheme } = useMantineColorScheme()
  const navigate = useNavigate()
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const reinitializeRef = useRef<() => void>(() => {})
  const router = useRouter()

  useEffect(() => {
    const unsubscribe = router.subscribe("onRendered", () => {
      window.scrollTo({ top: 0, behavior: "smooth" })
      reinitializeRef.current()
    })
    return unsubscribe
  }, [router])

  const pageItems = headerLinks
    .filter((link) => opened || pathname.startsWith(link.to))
    .map((link) => {
      const children = link.pages.map((page) => (
        <NavLink
          classNames={NavLinkClasses}
          variant="subtle"
          key={page.key}
          active={pathname === page.to}
          label={page.label}
          description={page.description}
          leftSection={page.icon}
          onClick={() => {
            navigate({ to: page.to })
            close()
          }}
        />
      ))
      return opened ? <NavLink
        defaultOpened={true}
        classNames={NavLinkClasses}
        variant="subtle"
        key={link.to}
        active={pathname.startsWith(link.to)}
        label={link.label}
        description=""
        leftSection={link.pages[0].icon}
      >
      {children}
      </NavLink> : children
    })
  

  const headerItems = headerLinks.map((link) => (
    <Button key={link.label} variant={pathname.includes(link.to) ? "light" : "subtle"} onClick={() => navigate({ to: link.to })}>
      {link.label}
    </Button>
  ))

  return (
    <AppShell
      padding="xl"
      layout="default"
      header={{ height: 80 }}
      navbar={{ width: 300, breakpoint: "md", collapsed: { mobile: !opened } }}
      aside={{ width: 280, breakpoint: "md", collapsed: { mobile: true, desktop: false } }}
      classNames={AppShellClasses}
    >
      <AppShell.Header>
        <Group h="100%" px="xl" justify="space-between" wrap="nowrap">
          <Group gap="md" wrap="nowrap" px="xl">
            <Burger opened={opened} onClick={toggle} hiddenFrom="md" size="sm" />
            <Link to="/" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", color: "inherit", textDecoration: "none" }}>
              <img src={icon} alt="GRX Docs" />
              <Title order={2}>GRX Docs</Title>
            </Link>
            <Group ml={10} gap={5} className={classes.links} visibleFrom="sm">
              {headerItems}
            </Group>
          </Group>

          <Group gap="md" wrap="nowrap" px="xl">
            <Autocomplete
              className={classes.search}
              placeholder="Search"
              leftSection={<IconSearch size={16} stroke={1.5} />}
              data={["complete me"]}
              visibleFrom="xs"
            />
            <ActionIcon
              variant="transparent"
              aria-label="Toggle color scheme"
              onClick={() => toggleColorScheme()}
              title={colorScheme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              {colorScheme === "dark" ? <IconSun size={18} /> : <IconMoon size={18} />}
            </ActionIcon>
            <ActionIcon variant="transparent" aria-label="GitHub" component="a" href="https://github.com/hpcreery/GRX" target="_blank">
              <IconBrandGithub size={18} />
            </ActionIcon>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar>
        <AppShell.Section>
          <Text fw={600} size="sm" px="sm" pt="sm" pb="sm" ta="center">
            {"Pages"}
          </Text>
        </AppShell.Section>

        <AppShell.Section component={ScrollArea} grow>
          <Stack gap={6}>{pageItems}</Stack>
        </AppShell.Section>
      </AppShell.Navbar>

      <AppShell.Aside visibleFrom="md">
        <AppShell.Section>
          <Text fw={600} size="sm" px="sm" pt="xs" pb="sm" ta="center">
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
              classNames={TableOfContentsClasses}
            />
          </Box>
        </AppShell.Section>
      </AppShell.Aside>

      <AppShell.Main className="main">
        <Stack gap="lg" mx="auto" maw={1000}>
          <Outlet />
        </Stack>
      </AppShell.Main>
    </AppShell>
  )
}
