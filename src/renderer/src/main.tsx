import { useState } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { ConfigProvider, ThemeConfig, theme } from 'antd'
import { ConfigEditorProvider } from './contexts/ConfigEditor'
import reportWebVitals from './reportWebVitals'

function Main(): JSX.Element | null {
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>('dark')
  const [themeState, setThemeState] = useState<ThemeConfig>({
    token: {
      colorPrimary: '#355E3B'
    }
  })
  const [transparency, setTransparency] = useState(true)
  const [componentSize, setComponentSize] = useState<'small' | 'middle' | 'large'>('middle')
  const blur = 30
  return (
    <ConfigProvider
      theme={{
        ...themeState,
        algorithm: themeMode == 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm
      }}
      componentSize={componentSize}
    >
      <ConfigEditorProvider.Provider
        value={{
          themeState,
          setThemeState,
          themeMode,
          setThemeMode,
          transparency,
          setTransparency,
          blur,
          componentSize,
          setComponentSize
        }}
      >
        <App />
      </ConfigEditorProvider.Provider>
    </ConfigProvider>
  )
}

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement)
root.render(<Main />)

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals()
