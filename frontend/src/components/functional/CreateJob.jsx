// REACT
import React, { useState } from 'react'

// ANT DESIGN
import { Modal, Button, Input, message } from 'antd'

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
    if (job == null || job === '') {
      message.warning('Must Assign your job a name')
      return
    }
    try {
      var response = await fetch(`${backendurl}${port}/job?job=${job}`, {
        method: 'POST',
      })
      if (response.status !== 200) {
        var err = await response.text()
        console.log(err)
        try {
          let errjson = JSON.parse(err)
          err = errjson['Message']
        } catch (e) { }
        throw err
      }
    } catch (err) {
      console.error(err)
      message.error(err)
      return
    }
    setVisible(false)
    update()
    replaceArtwork(job)
  }

  const handleCancel = (e) => {
    setVisible(false)
  }

  const handleInput = (e) => {
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
        keyboard
      >
        <Input placeholder='enter job name' onChange={handleInput} onPressEnter={() => handleOk()} />
      </Modal>
    </div>
  )
}

export default CreateJob
