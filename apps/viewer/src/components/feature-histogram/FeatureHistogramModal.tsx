import { types } from "@grx/engine"
import { Divider, Flex, Kbd, Modal, Select, Switch, Text } from "@mantine/core"
import { type UseDisclosureReturnValue, useHotkeys, useLocalStorage } from "@mantine/hooks"
import { EditorConfigProvider } from "@src/contexts/EditorContext"
import { actions } from "@src/contexts/Spotlight"
import { IconHexagonPlus, IconZoom, IconZoomScan } from "@tabler/icons-react"
import { type JSX, useContext, useEffect, useState } from "react"

type HistogramModal = {
  modalDisclosure: UseDisclosureReturnValue
  layerName: string
  stepName: string
}

export default function HistogramModal(props: HistogramModal): JSX.Element | null {
  const { renderer } = useContext(EditorConfigProvider)
  const [histogram, setHistogram] = useState<Record<string, number>>({})
  const [histogramModal, histogramModalHandlers] = props.modalDisclosure

  async function fetchHistogram(): Promise<void> {
    const histogramQuery = await renderer.engine.interface.read_layer_histogram("main", props.stepName, props.layerName)
    console.log("Fetched histogram:", histogramQuery)
    setHistogram(histogramQuery)
  }

  useEffect(() => {
    if (histogramModal) {
      fetchHistogram()
    }
  }, [histogramModal, props.stepName, props.layerName, renderer])

  return (
    <Modal title={`Histogram for ${props.layerName}`} keepMounted opened={histogramModal} onClose={histogramModalHandlers.close}>
      {/* {JSON.stringify(histogram)} */}
      {/* make it pretty */}
      {Object.entries(histogram).map(([key, value]) => (
        <>
          <Divider key={`${key}-divider`} my="sm" />
          <Flex key={key} justify="space-between" align="center" mb="sm">
            <Text>{key}: </Text>
            <Text>{value}</Text>
          </Flex>
        </>
      ))}
      {/* Show the total */}
      <Divider my="sm" />
      <Flex justify="space-between" align="center" mb="sm">
        <Text>Total: </Text>
        <Text>{Object.values(histogram).reduce((a, b) => a + b, 0)}</Text>
      </Flex>
    </Modal>
  )
}
