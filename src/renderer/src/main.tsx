import ReactDOM from "react-dom/client"
import { ThemeConfigProvider } from "./contexts/ThemeContext"
import { MantineProvider, createTheme } from "@mantine/core"
import { Notifications } from "@mantine/notifications"
import { useLocalStorage } from "@mantine/hooks"
import { ContextMenuProvider } from "mantine-contextmenu"
import App from "./App"
// import DemoApp from "./renderer/DEMO"
// import NCDemo from '@lib/nc/DEMO'

import { Spotlight } from "@mantine/spotlight"
import { spotlightStore, actions } from "./contexts/Spotlight"

// STYLES
import "@mantine/core/styles.css"
import "mantine-contextmenu/styles.css"
import "@mantine/dropzone/styles.css"
import "@mantine/notifications/styles.css"
import "@mantine/spotlight/styles.css"
import "@mantine/code-highlight/styles.css"
import { JSX } from 'react'

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
      dark: ["#C2C2C2", "#A7A7A7", "#919191", "#5E5E5E", "#393939", "#2D2D2D", "#262626", "#1B1B1B", "#141414", "#101010"],
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
