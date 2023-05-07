import { THistogram } from '@renderer/renderer/types'
import VirtualGerberApplication from '@renderer/renderer/virtual'
import { Modal, List, Descriptions, Spin, Avatar } from 'antd'
import { useState, useEffect, forwardRef, useImperativeHandle } from 'react'

export interface FeatureHistogramModalProps {
  gerberApp: VirtualGerberApplication
  uid: string
}

export interface FeatureHistogramModalRef {
  open: () => void
  close: () => void
}

const FeatureHistogramModal = forwardRef<FeatureHistogramModalRef, FeatureHistogramModalProps>(
  function (props: FeatureHistogramModalProps, ref: any) {
    const { gerberApp, uid } = props
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [loading, setLoading] = useState(true)
    const [queriedTools, setQueriedTools] = useState<boolean>(false)
    const [histogram, setHistogram] = useState<THistogram>()

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
          open: () => {
            setIsModalOpen(true)
          },
          close: () => {
            setIsModalOpen(false)
          }
        }
      },
      []
    )

    const handleOk = () => {
      setIsModalOpen(false)
    }

    const handleCancel = () => {
      setIsModalOpen(false)
    }

    return (
      <>
        <Modal
          title="Feature Histogram"
          open={isModalOpen}
          onOk={handleOk}
          onCancel={handleCancel}
          destroyOnClose={true}
        >
          <Spin spinning={loading}>
            <List
              // size="small"
              pagination={{ position: 'bottom', align: 'end' }}
              bordered
              dataSource={histogram}
              renderItem={(item) => (
                <List.Item>
                  <Descriptions labelStyle={{ padding: 0 }}>
                    <Descriptions.Item label="dcode">{item.dcode ?? 'contour'}</Descriptions.Item>
                    <Descriptions.Item label="qty">{item.indexes.length}</Descriptions.Item>
                    <Descriptions.Item label="polarity">{item.polarity}</Descriptions.Item>
                  </Descriptions>
                  {/* <FeatureHistogramListItem uid={uid} item={item} gerberApp={gerberApp} /> */}
                </List.Item>
              )}
            />
          </Spin>
        </Modal>
      </>
    )
  }
)

function FeatureHistogramListItem(props: {
  uid: string
  item: THistogram[number]
  gerberApp: VirtualGerberApplication
}) {
  const [imageSrc, setImageSrc] = useState<string>('')
  const { uid, item, gerberApp } = props
  useEffect(() => {
    gerberApp.renderer.then(async (r) => {
      const imageSrcString = await r.getLayerFeaturePng(uid, item.indexes[0])
      setImageSrc(imageSrcString)
      console.log(imageSrcString)
    })
  }, [item])
  return (
    <List.Item>
      <List.Item.Meta
        avatar={
          <Spin spinning={imageSrc === ''}>
            <Avatar src={item.dcode ? imageSrc : ''} />
          </Spin>
        }
        title={item.dcode ? `D${item.dcode}` : 'Contour'}
        description={
          <Descriptions labelStyle={{ padding: 0 }}>
            <Descriptions.Item label="qty">{item.indexes.length}</Descriptions.Item>
            <Descriptions.Item label="polarity">{item.polarity}</Descriptions.Item>
          </Descriptions>
        }
      />
    </List.Item>
  )
}

export default FeatureHistogramModal
