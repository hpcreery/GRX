// import '../App.css'
import React from 'react'
import VirtualGerberApplication, { ScreenGerberApplicationProps } from '../renderer/virtual'

// interface RendererProps {
//   backgroundColor?: ColorSource
// }

// const Renderer = forwardRef<OffscreenGerberApplication | undefined, React.PropsWithChildren<RendererProps>>(
//   (prop: RendererProps, ref) => {
//     const elementRef = useRef<HTMLDivElement>(document.createElement('div'))
//     const gerberApp = useRef<OffscreenGerberApplication>()

//     // useImperativeHandle(ref, () => ({
//     //   addGerber: (gerber: string) => {
//     //     gerberApp.current && gerberApp.current.addGerber(gerber)
//     //   },
//     //   zoomHome: () => {
//     //     gerberApp.current && gerberApp.current.zoomHome()
//     //   }
//     // }))

//     useImperativeHandle(ref, () => gerberApp.current)

//     useEffect(() => {
//       gerberApp.current = insertGerberApp(elementRef.current)
//       return () => {
//         gerberApp.current && gerberApp.current.destroy()
//         elementRef.current.innerHTML = ''
//       }
//     }, [])

//     useEffect(() => {
//       if (gerberApp.current) {
//         gerberApp.current.renderer.then((renderer) => {
//           // @ts-ignore
//           renderer.renderer.backgroundColor = chroma(prop.backgroundColor).num()
//           // renderer.zoomHome()
//         })
//         gerberApp.current.zoomHome()
//       }
//     }, [prop.backgroundColor])

//     async function getGerber(path: string) {
//       const gerber = await fetch(path).then((res) => res.text())
//       return gerber
//     }

//     function insertGerberApp(element: HTMLDivElement) {
//       let app = new OffscreenGerberApplication({
//         element: element,
//         antialias: false,
//         backgroundColor: prop.backgroundColor || 0x0e0e0e,
//       })
//       return app
//     }

//     return <div id='GRX' style={{ width: '100%', height: '100%' }} ref={elementRef} />
//   }
// )

// export default Renderer

export default class Renderer extends React.Component<ScreenGerberApplicationProps> {
  rendererDiv: HTMLDivElement
  constructor(props: ScreenGerberApplicationProps) {
    super(props)
    // this.rendererDiv = () => <div id='GRX' style={{ width: '100%', height: '100%' }} />
    this.rendererDiv = document.createElement('div')
    // @ts-ignore
    const app = new VirtualGerberApplication({ ...props, element: this.rendererDiv })
  }
  render() {
    return (
      <div
        id='GRX'
        style={{ width: '100%', height: '100%' }}
        dangerouslySetInnerHTML={{ __html: this.rendererDiv.innerHTML }}
      />
    )
  }
}
