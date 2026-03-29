import { MantineProvider } from "@mantine/core"
import ReactDOM from "react-dom/client"
import DemoApp from "./DEMO"

// STYLES
import "@mantine/core/styles.css"
import type { JSX } from "react"

function Main(): JSX.Element | null {
  return (
    <MantineProvider defaultColorScheme="dark">
      <DemoApp />
    </MantineProvider>
  )
}

const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement)
root.render(<Main />)
