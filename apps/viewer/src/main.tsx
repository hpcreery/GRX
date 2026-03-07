import { createTheme, MantineProvider } from "@mantine/core"
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
