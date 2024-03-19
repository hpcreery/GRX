import ReactDOM from 'react-dom/client'
import App from './App'
import { ConfigEditorProvider } from './contexts/ConfigEditor'
import { MantineProvider, createTheme } from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import { useLocalStorage } from '@mantine/hooks'
import { ContextMenuProvider } from 'mantine-contextmenu'
import '@mantine/core/styles.css';

import REGLApp from './renderer/DEMO'

const blur = 30

const theme = createTheme({
  primaryColor: 'teal',
  defaultRadius: 'md',
  colors: {
    dark: [
      '#C2C2C2',
      '#A7A7A7',
      '#919191',
      '#5E5E5E',
      '#393939',
      '#2D2D2D',
      '#262626',
      '#1B1B1B',
      '#141414',
      '#101010'
    ]
  },
  other: {},
  // components: {
  //   Button: {
  //     // styles: {
  //     //   root: { fontWeight: 50 }
  //     // }
  //   }
  // },
  // globalStyles: (theme) => ({
  //   '.transparency': {
  //     backdropFilter: transparency ? `blur(${blur}px)` : '',
  //     backgroundColor: transparency
  //       ? chroma(theme.colorScheme == 'dark' ? theme.colors.dark[7] : theme.colors.gray[1])
  //           .alpha(0.7)
  //           .css()
  //       : chroma(
  //           theme.colorScheme == 'dark' ? theme.colors.dark[7] : theme.colors.gray[1]
  //         ).css()
  //   },
  //   '.tabler-icon': {
  //     strokeWidth: 1.5,
  //     color: theme.colorScheme == 'dark' ? theme.colors.dark[0] : theme.colors.gray[9]
  //   }
  // })
  // primaryShade: 7
}
)

function Main(): JSX.Element | null {

  const [transparency, setTransparency] = useLocalStorage<boolean>({
    key: 'transparency',
    defaultValue: false
  })


  return (
    <ConfigEditorProvider.Provider
      value={{
        transparency,
        setTransparency
      }}
    >
      <MantineProvider
        defaultColorScheme="dark"
        theme={theme}
      >
        <ContextMenuProvider zIndex={1000} shadow="md" borderRadius="md">
          <Notifications />
          {/* <App /> */}
          {/* <div>Hello</div> */}
          {/* <GlApp /> */}
          <REGLApp />
        </ContextMenuProvider>
      </MantineProvider>
    </ConfigEditorProvider.Provider>
  )
}

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement)
root.render(<Main />)
