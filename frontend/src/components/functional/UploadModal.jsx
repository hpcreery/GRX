// REACT
import React, { useState, useEffect } from 'react'

// ANT DESIGN
import { Modal, Button } from 'antd'

// CUSTOM
import UploadGerber from './UploadGerber'

// CONFIG
const { backendurl, port } = require('../../config/config')

const UploadModal = (props) => {
  var { replaceArtwork, job } = props

  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Mount and Update
    return () => {
      // Unmount
    }
  }, [job])

  const showModal = () => {
    setVisible(true)
  }

  const handleOk = (e) => {
    console.log(e)
    setVisible(false)
    replaceArtwork(job)
  }

  const handleCancel = (e) => {
    console.log(e)
    setVisible(false)
  }

  return (
    <div>
      <Button type='text' size='small' onClick={showModal}>
        Upload
      </Button>
      <Modal
        title={`Import Gerbers into Job: ${job}`}
        visible={visible}
        onOk={handleOk}
        onCancel={handleCancel}
        destroyOnClose
      >
        <UploadGerber job={job} />
      </Modal>
    </div>
  )
}

export default UploadModal
