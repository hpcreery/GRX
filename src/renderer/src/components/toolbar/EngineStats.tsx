import { useEffect, useContext, useState } from "react"
import { Table, TableData } from "@mantine/core"
import { EditorConfigProvider } from "@src/contexts/EditorContext"

interface EngineStatsProps {}
export default function EngineStats(_props: EngineStatsProps): JSX.Element {
  const { renderEngine } = useContext(EditorConfigProvider)
  const [count, setCount] = useState<number>(0)
  const [cpuTime, setCPUTime] = useState<number>(0)
  const [gpuTime, setGPUTime] = useState<number>(0)
  const [averageGPUTime, setAverageGPUTime] = useState<number>(0)
  const [averageCPUTime, setAverageCPUTime] = useState<number>(0)
  const [fps, setFPS] = useState<number>(0)
  const [gpuFPS, setGPUFPS] = useState<number>(0)
  const [textureSize, setTextureSize] = useState<number>(0)
  const [bufferSize, setBufferSize] = useState<number>(0)
  const [renderBufferSize, setRenderBufferSize] = useState<number>(0)
  const [bufferCount, setBufferCount] = useState<number>(0)
  const [textureCount, setTextureCount] = useState<number>(0)
  const [shaderCount, setShaderCount] = useState<number>(0)
  const [framebufferCount, setFramebufferCount] = useState<number>(0)
  const [elementsCount, setElementsCount] = useState<number>(0)

  const round = (value: number, precision: number): number => {
    const multiplier = Math.pow(10, precision || 0)
    return Math.round(value * multiplier) / multiplier
  }

  const update = async (): Promise<void> => {
    const precision = 3
    const stats = await renderEngine.getStats()
    const averageGPU = stats.world.gpuTime / stats.world.count
    setAverageGPUTime(round(averageGPU, precision))
    const averageCPU = stats.world.cpuTime / stats.world.count
    setAverageCPUTime(round(averageCPU, precision))
    setCount(stats.world.count)
    setCPUTime(round(stats.world.cpuTime, precision))
    setGPUTime(round(stats.world.gpuTime, precision))
    setFPS(Math.round(1000 / ((stats.world.cpuTime + stats.world.gpuTime) / stats.world.count)))
    setGPUFPS(Math.round(1000 / (stats.world.gpuTime / stats.world.count)))
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
      ["Frame Count*", count],
      ["Total CPU Time", `${cpuTime}ms`],
      ["Total GPU Time", `${gpuTime}ms`],
      ["Avg CPU Time", `${averageCPUTime}ms`],
      ["Avg GPU Time", `${averageGPUTime}ms`],
      ["Theoretical FPS", fps],
      ["GPU FPS", gpuFPS],
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
