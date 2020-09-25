// REACT
import React, { Component } from 'react';

// ANT DESIGN
import { Upload, Button } from 'antd';
import { UploadOutlined } from '@ant-design/icons';

// CONFIG
const { backendurl, port } = require('../../config/config');

class UploadGerber extends Component {
  constructor(props) {
    super(props);
    let job = this.props.job || 'GRX';
    this.state = {
      fileList: [],
      job: job,
    };
  }

  // Input box for job name, if jobname exist
  // Fetch Initial gerber list to see contents if uploading more to same folder
  // fetch 'uploaded' with job

  getExistingFiles = async () => {
    var data = await fetch(
      `${backendurl}:${port}/uploaded?job=${this.state.job}`
    );
    var response = await data.json();
    var items = response.map((filename) => ({
      uid: filename,
      name: filename,
      status: 'done',
    }));
    console.log(items);
    this.setState({ fileList: items });
    return items;
  };

  // fileList object example
  // {
  //   uid: '-1',
  //   name: 'xxx.png',
  //   status: 'done',
  // },

  handleChange = (info) => {
    console.log(info);
    let fileList = [...info.fileList];

    // 1. Limit the number of uploaded files
    // Only to show two recent uploaded files, and old ones will be replaced by the new
    // fileList = fileList.slice(-2);

    // 2. Read from response and show file link
    fileList = fileList.map((file) => {
      if (file.response) {
        // Component will show file.url as link
        file.url = file.response.url;
      }
      return file;
    });
    console.log(fileList);

    this.setState({ fileList });
  };

  handleRemove = async (file) => {
    console.log(file);
    var response = await fetch(
      `${backendurl}:${port}/file?job=${this.state.job}&filename=${file.name}`,
      { method: 'DELETE' }
    );
    return new Promise((resolve, reject) => {
      try {
        if (response.status !== 200) {
          console.error(response);
          var err = response.text();
          throw err;
        }
        //let data = response.json();
        resolve(response);
      } catch (err) {
        reject(err);
      }
    });
  };

  render() {
    const props = {
      action: `${backendurl}:${port}/upload?job=${this.state.job}`,
      onChange: this.handleChange,
      onRemove: this.handleRemove,
      multiple: true,
    };
    return (
      <div>
        <Button onClick={() => this.getExistingFiles()}>Refresh</Button>
        <Upload {...props} fileList={this.state.fileList}>
          <Button icon={<UploadOutlined />}>Upload Gerbers</Button>
        </Upload>
      </div>
    );
  }

  componentDidMount() {
    this.getExistingFiles();
  }
}

export default UploadGerber;
