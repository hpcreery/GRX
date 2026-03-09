import { createTheme, MantineProvider, rem } from "@mantine/core"
import { useLocalStorage } from "@mantine/hooks"
import { Notifications } from "@mantine/notifications"
import { Spotlight } from "@mantine/spotlight"
import { ContextMenuProvider } from "mantine-contextmenu"
import ReactDOM from "react-dom/client"
import App from "./App"
import { actions, spotlightStore } from "./contexts/Spotlight"
import { ThemeConfigProvider } from "./contexts/ThemeContext"

// STYLES
import "@mantine/core/styles.css"
import "mantine-contextmenu/styles.css"
import "@mantine/dropzone/styles.css"
import "@mantine/notifications/styles.css"
import "@mantine/spotlight/styles.css"
import "@mantine/code-highlight/styles.css"
import type { JSX } from "react"

import cozetteFont from "./assets/cozette.ttf?url"

const f = new FontFace("cozette", `url(${cozetteFont})`)
f.load().then((font) => {
  document.fonts.add(font)
})

function Main(): JSX.Element | null {
  // BufferCollection.test()
  const [transparency, setTransparency] = useLocalStorage<boolean>({
    key: "transparency",
    defaultValue: false,
  })

  const [primaryColor, setPrimaryColor] = useLocalStorage<string>({
    key: "primaryColor",
    defaultValue: "teal",
  })

  const theme = createTheme({
    primaryColor: primaryColor,
    defaultRadius: "md",
    colors: {
      old: ["#C2C2C2", "#A7A7A7", "#919191", "#5E5E5E", "#393939", "#2D2D2D", "#262626", "#1B1B1B", "#141414", "#101010"],
      dark: ["#C2C2C2", "#A7A7A7", "#919191", "#5E5E5E", "#393939", "#2D2D2D", "#101010", "#0f0f0f", "#090909", "#000000"],
    },
    other: {},
    // fontFamily: "JetBrains Mono, monospace",
    // fontFamilyMonospace: "JetBrains Mono, monospace",
    // headings: { 
    //   fontFamily: "JetBrains Mono, monospace",
    // },
    // fontSizes: {
    //   xs: rem(10),
    //   sm: rem(12),
    //   md: rem(14),
    //   lg: rem(16),
    //   xl: rem(18),
    // },

    fontFamily: "cozette",
    fontFamilyMonospace: "cozette",
    headings: { 
      fontFamily: "cozette",
      sizes: {
        h1: { fontSize: '13px', fontWeight: 'normal', lineHeight: '1.3' },
        h2: { fontSize: '13px', fontWeight: 'normal', lineHeight: '1.35' },
        h3: { fontSize: '13px', fontWeight: 'normal', lineHeight: '1.4' },
        h4: { fontSize: '13px', fontWeight: 'normal', lineHeight: '1.45' },
        h5: { fontSize: '13px', fontWeight: 'normal', lineHeight: '1.5' },
      },
      fontWeight: 'normal',
    },
    fontSizes: {
      xs: '13px',
      sm: '13px',
      md: '13px',
      lg: '13px',
      xl: '13px',
    },
    lineHeights: {
      xs: '1.3',
      sm: '1.35',
      md: '1.4',
      lg: '1.45',
      xl: '1.5',
    },
    fontSmoothing: false,
    spacing: {
      xs: '4px',
      sm: '6px',
      md: '8px',
      lg: '10px',
      xl: '12px',
    },
  })

  return (
    <ThemeConfigProvider.Provider
      value={{
        transparency,
        setTransparency,
        primaryColor: primaryColor,
        setPrimaryColor: setPrimaryColor,
      }}
    >
      <MantineProvider defaultColorScheme="dark" theme={theme}>
        <ContextMenuProvider zIndex={1000} shadow="md" borderRadius="md">
          <Spotlight store={spotlightStore} actions={actions} shortcut={["/"]} />
          <Notifications />
          <App />
          {/* <DemoApp /> */}
          {/* <NCDemo /> */}
        </ContextMenuProvider>
      </MantineProvider>
    </ThemeConfigProvider.Provider>
  )
}

const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement)
root.render(<Main />)
