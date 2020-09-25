// REACT
import React, { Component } from 'react';

// ANT DESIGN
import { Modal, Button } from 'antd';

// CUSTOM
import UploadGerber from './UploadGerber'

// CONFIG
const { backendurl, port } = require('../../config/config')

class UploadModal extends Component {
  constructor(props) {
    super(props)
  }


  state = { visible: false };

  showModal = () => {
    this.setState({
      visible: true,
    });
  };

  handleOk = e => {
    console.log(e);
    this.setState({
      visible: false,
    });
  };

  handleCancel = e => {
    console.log(e);
    this.setState({
      visible: false,
    });
  };

  render() {
    return (
      <div>
        <Button size='small' onClick={this.showModal}>
          Upload
        </Button>
        <Modal
          title={`Import Gerbers into Job: ${this.props.job}`}
          visible={this.state.visible}
          onOk={this.handleOk}
          onCancel={this.handleCancel}
        >
          <UploadGerber job={this.props.job}/>
        </Modal>
      </div>
    );
  }
}

export default UploadModal