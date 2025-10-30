import { useEffect, useContext, useState, JSX } from "react"
import { Table, TableData } from "@mantine/core"
import { EditorConfigProvider } from "@src/contexts/EditorContext"

interface EngineStatsProps {}
export default function EngineStats(_props: EngineStatsProps): JSX.Element {
  const { renderer } = useContext(EditorConfigProvider)
  const [fps, setFPS] = useState<number>(0)
  const [renderTime, setRenderTime] = useState<number>(0)
  const [textureSize, setTextureSize] = useState<number>(0)
  const [bufferSize, setBufferSize] = useState<number>(0)
  const [renderBufferSize, setRenderBufferSize] = useState<number>(0)
  const [bufferCount, setBufferCount] = useState<number>(0)
  const [textureCount, setTextureCount] = useState<number>(0)
  const [shaderCount, setShaderCount] = useState<number>(0)
  const [framebufferCount, setFramebufferCount] = useState<number>(0)
  const [elementsCount, setElementsCount] = useState<number>(0)

  const update = async (): Promise<void> => {
    const stats = await renderer.engine.getStats()
    setRenderTime(Math.round(stats.engine.renderTimeMilliseconds))
    setFPS(Math.round(1000 / stats.engine.renderTimeMilliseconds))
    setTextureSize(Math.round(stats.regl.totalTextureSize / 1024 / 1024))
    setBufferSize(Math.round(stats.regl.totalBufferSize / 1024 / 1024))
    setRenderBufferSize(Math.round(stats.regl.totalRenderbufferSize / 1024 / 1024))
    setBufferCount(stats.regl.bufferCount)
    setTextureCount(stats.regl.textureCount)
    setShaderCount(stats.regl.shaderCount)
    setFramebufferCount(stats.regl.framebufferCount)
    setElementsCount(stats.regl.elementsCount)
    requestAnimationFrame(update)
  }

  useEffect(() => {
    requestAnimationFrame(update)
  }, [])

  const tableData: TableData = {
    caption: "Engine Stats",
    head: ["Name", "Value"],
    body: [
      ["Theoretical FPS", fps],
      ["Render Time", `${renderTime}ms`],
      ["Texture Size*", `${textureSize}MB`],
      ["Buffer Size*", `${bufferSize}MB`],
      ["Render Buffer Size*", `${renderBufferSize}MB`],
      ["Buffer Count*", bufferCount],
      ["Texture Count*", textureCount],
      ["Shader Count*", shaderCount],
      ["Framebuffer Count*", framebufferCount],
      ["Elements Count*", elementsCount],
    ],
    foot: ["*Value is total accumulated, not current."],
  }

  return <Table data={tableData} captionSide="top" highlightOnHover withColumnBorders />
}
