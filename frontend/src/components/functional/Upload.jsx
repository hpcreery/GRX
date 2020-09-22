// REACT
import React, { Component } from 'react'

// ANT DESIGN
import { Upload, Button } from 'antd';
import { UploadOutlined } from '@ant-design/icons';

// BACKEND
const { backendurl } = require('../config/config')

class Upload extends Component {
  constructor(props) {
    super(props)

  }
  state = {
    fileList: [
      {
        uid: '-1',
        name: 'xxx.png',
        status: 'done',
      },
    ],
  };

  handleChange = info => {
    let fileList = [...info.fileList];

    // 1. Limit the number of uploaded files
    // Only to show two recent uploaded files, and old ones will be replaced by the new
    // fileList = fileList.slice(-2);

    // 2. Read from response and show file link
    fileList = fileList.map(file => {
      if (file.response) {
        // Component will show file.url as link
        file.url = file.response.url;
      }
      return file;
    });

    this.setState({ fileList });
  };

  render() {
    const props = {
      action: backendurl,
      onChange: this.handleChange,
      multiple: true,
    };
    return (
      <Upload {...props} fileList={this.state.fileList}>
        <Button icon={<UploadOutlined />}>Upload Gerbers</Button>
      </Upload>
    );
  }
}

export default Upload