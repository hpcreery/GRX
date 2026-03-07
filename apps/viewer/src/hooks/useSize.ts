import useResizeObserver from "@react-hook/resize-observer"
import { useLayoutEffect, useState } from "react"

interface Size {
  width: number
  height: number
}
export default function useSize<T extends HTMLElement>(target: React.MutableRefObject<T>): Size | undefined {
  const [size, setSize] = useState<Size>()

  useLayoutEffect(() => {
    const { width, height }: DOMRect = target.current.getBoundingClientRect()
    setSize({ width, height })
  }, [target])

  useResizeObserver(target, (entry) => {
    const { inlineSize: width, blockSize: height } = entry.contentBoxSize[0]
    setSize({ width, height })
  })
  return size
}
