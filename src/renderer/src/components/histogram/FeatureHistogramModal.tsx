import { THistogram } from '@src/old-renderer/types'
import VirtualGerberApplication from '@src/old-renderer/virtual'
import { Modal, Table, Loader, Center } from '@mantine/core'
import { useState, useEffect, forwardRef, useImperativeHandle } from 'react'
import { useDisclosure } from '@mantine/hooks'

export interface FeatureHistogramModalProps {
  gerberApp: VirtualGerberApplication
  uid: string
}

export interface FeatureHistogramModalRef {
  open: () => void
  close: () => void
}

const FeatureHistogramModal = forwardRef<FeatureHistogramModalRef, FeatureHistogramModalProps>(
  function FeatureHistogramModal(props: FeatureHistogramModalProps, ref: any) {
    const [isModalOpen, { open: openModal, close: closeModal }] = useDisclosure(false)
    const { gerberApp, uid } = props
    const [loading, setLoading] = useState(true)
    const [queriedTools, setQueriedTools] = useState<boolean>(false)
    const [histogram, setHistogram] = useState<THistogram | undefined>(undefined)

    useEffect(() => {
      if (isModalOpen && !queriedTools) {
        gerberApp.renderer.then(async (r) => {
          const histogram = await r.computeLayerFeaturesHistogram(uid)
          setHistogram(histogram)
          console.log(histogram)
        })
        setQueriedTools(true)
        setLoading(false)
      }
    }, [isModalOpen])

    useImperativeHandle(
      ref,
      () => {
        return {
          open: openModal,
          close: closeModal
        }
      },
      []
    )

    return (
      <>
        <Modal title="Feature Histogram" opened={isModalOpen} onClose={closeModal}>
          {loading || histogram == undefined ? (
            <Center w={'100%'} h={'100%'} mx="auto">
              <Loader />
            </Center>
          ) : (
            <Table highlightOnHover withBorder>
              <thead>
                <tr>
                  <th>dcode</th>
                  <th>qty</th>
                  <th>polarity</th>
                </tr>
              </thead>
              <tbody>
                {histogram.map((row) => (
                  <tr key={row.dcode}>
                    <td>{row.dcode ?? 'contour'}</td>
                    <td>{row.indexes.length}</td>
                    <td>{row.polarity}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
          {/* </Spin> */}
        </Modal>
      </>
    )
  }
)

// function FeatureHistogramListItem(props: {
//   uid: string
//   item: THistogram[number]
//   gerberApp: VirtualGerberApplication
// }) {
//   const [imageSrc, setImageSrc] = useState<string>('')
//   const { uid, item, gerberApp } = props
//   useEffect(() => {
//     gerberApp.renderer.then(async (r) => {
//       const imageSrcString = await r.getLayerFeaturePng(uid, item.indexes[0])
//       setImageSrc(imageSrcString)
//       console.log(imageSrcString)
//     })
//   }, [item])
//   return <></>
// }

export default FeatureHistogramModal
