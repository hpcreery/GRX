// REACT
import React, { useState, useEffect } from 'react'

// ANT DESIGN
import { Upload, Button } from 'antd'
import { UploadOutlined, ReloadOutlined } from '@ant-design/icons'
const { Dragger } = Upload

// CONFIG
const { backendurl, port } = require('../../config/config')

const UploadGerber = (props) => {
  console.log(props.job)
  var { job } = props
  const [fileList, setFileList] = useState([])
  const [reloading, setReloading] = useState(false)

  useEffect(() => {
    // Mount and Update
    getExistingFiles()
    return () => {
      // Unmount
    }
  }, [])
  // ^^ React Hook useEffect has a missing dependency: 'getExistingFiles'. 
  // Either include it or remove the dependency array.eslintreact - hooks / exhaustive - deps

  const getExistingFiles = async () => {
    setReloading(true)
    var data = await fetch(`${backendurl}${port}/uploaded?job=${job}`)
    var response = await data.json()
    var items = response.map((filename) => ({
      uid: filename,
      name: filename,
      status: 'done',
    }))
    setFileList(items)
    setReloading(false)
    return items
  }

  // fileList object example
  // {
  //   uid: '-1',
  //   name: 'xxx.png',
  //   status: 'done',
  // },

  const handleChange = (info) => {
    console.log(info)
    let newfileList = [...info.fileList]

    // 1. Limit the number of uploaded files
    // Only to show two recent uploaded files, and old ones will be replaced by the new
    // fileList = fileList.slice(-2);

    // 2. Read from response and show file link
    newfileList = newfileList.map((file) => {
      if (file.response) {
        // Component will show file.url as link
        console.log(file.url)
        file.url = file.response.url
      }
      return file
    })
    setFileList(newfileList)
  }

  const handleRemove = async (file) => {
    console.log(file)
    try {
      var response = await fetch(`${backendurl}${port}/file?job=${job}&filename=${file.name}`, {
        method: 'DELETE',
      })
    } catch (err) {
      throw err
    }

    return new Promise((resolve, reject) => {
      try {
        if (response.status !== 200) {
          console.error(response)
          var err = response.text()
          throw err
        }
        //let data = response.json();
        resolve(response)
      } catch (err) {
        reject(err)
      }
    })
  }

  const uploadprops = {
    action: `${backendurl}${port}/upload?job=${job}`,
    onChange: handleChange,
    onRemove: handleRemove,
    multiple: true,
  }
  return (
    <div>
      <Dragger {...uploadprops} fileList={fileList}>
        <p>
          <UploadOutlined style={{ fontSize: '32px' }} />
        </p>
        <p>Drag Gerber Files Here</p>
        <p>(or click to open directory)</p>
      </Dragger>
      <div style={{ textAlign: 'right' }}>
        <Button
          loading={reloading}
          type='text'
          icon={<ReloadOutlined style={{ fontSize: '15px' }} />}
          onClick={() => getExistingFiles()}
        >
          Reload
        </Button>
      </div>
    </div>
  )
}

export default UploadGerber
