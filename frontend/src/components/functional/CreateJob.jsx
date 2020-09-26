// REACT
import React, { useState, useEffect } from 'react'

// ANT DESIGN
import { Modal, Button, Input } from 'antd'

// CUSTOM
import UploadGerber from './UploadGerber'

// CONFIG
const { backendurl, port } = require('../../config/config')

const CreateJob = (props) => {
  const { replaceArtwork, update } = props

  const [visible, setVisible] = useState(false)
  const [job, setJob] = useState(null)
  const [waitInput, setWaitInput] = useState(true)

  const showModal = () => {
    setVisible(true)
  }

  const handleOk = async (e) => {
    console.log(e)
    try {
      var response = await fetch(`${backendurl}:${port}/job?job=${job}`, {
        method: 'POST',
      })
      if (response.status !== 200) {
        console.error(response)
        var err = response.text()
        throw err
      }
      //let data = response.json();
      //return response
    } catch (err) {
      throw err
    }

    setVisible(false)
    update()
    replaceArtwork(job)
  }

  const handleCancel = (e) => {
    console.log(e)
    setVisible(false)
  }

  const handleInput = (e) => {
    console.log(e.target.value)
    setJob(e.target.value)
    setWaitInput(false)
  }

  return (
    <div>
      <Button type='text' size='small' onClick={showModal}>
        Create
      </Button>
      <Modal
        title={`Create New Job`}
        visible={visible}
        onOk={handleOk}
        onCancel={handleCancel}
        okButtonProps={{ disabled: waitInput }}
      >
        <Input placeholder='enter job name' onChange={handleInput} />
      </Modal>
    </div>
  )
}

export default CreateJob
