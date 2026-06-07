import { CodeHighlightAdapterProvider, createShikiAdapter } from "@mantine/code-highlight"
import { createTheme, MantineProvider, rem } from "@mantine/core"
import ReactDOM from "react-dom/client"
import App from "./App"

import "@mantine/core/styles.css"
import "./App.css"

// Shiki requires async code to load the highlighter
async function loadShiki() {
  const { createHighlighter } = await import("shiki")
  const shiki = await createHighlighter({
    langs: ["tsx", "ts", "json", "vue", "svelte"],
    // You can load supported themes here
    themes: [],
  })

  return shiki
}

const shikiAdapter = createShikiAdapter(loadShiki)

const theme = createTheme({
  primaryColor: "teal",
  defaultRadius: "md",
  colors: {
    old: ["#C2C2C2", "#A7A7A7", "#919191", "#5E5E5E", "#393939", "#2D2D2D", "#262626", "#1B1B1B", "#141414", "#101010"],
    dark: ["#C2C2C2", "#A7A7A7", "#919191", "#5E5E5E", "#393939", "#2D2D2D", "#101010", "#0f0f0f", "#090909", "#000000"],
  },
  fontFamily: "'IBM Plex Mono', monospace",
  fontFamilyMonospace: "'IBM Plex Mono', monospace",
  headings: {
    fontFamily: "'IBM Plex Mono', monospace",
  },
  lineHeights: {
    xs: "1.1",
    sm: "1.2",
    md: "1.25",
    lg: "1.3",
    xl: "1.4",
  },
  spacing: {
    xs: rem(4),
    sm: rem(8),
    md: rem(10),
    lg: rem(12),
    xl: rem(16),
  },
})

const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement)
root.render(
  <MantineProvider defaultColorScheme="dark" theme={theme}>
    <CodeHighlightAdapterProvider adapter={shikiAdapter}>
      <App />
    </CodeHighlightAdapterProvider>
  </MantineProvider>,
)
