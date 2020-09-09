// React
import React, { Component } from 'react';

// ANT DESIGN UI
import {
  Spin,
  Switch,
  Alert,
  Button,
  Card,
  Select,
  Tabs,
  Row,
  Col,
} from 'antd';
import { LoadingOutlined, VideoCameraOutlined } from '@ant-design/icons';

// ANT DESIGN CONSTANTS
const { Option, OptGroup } = Select;
const { TabPane } = Tabs;

// TRACESPACE
const pcbStackup = require('pcb-stackup');

class SideBar extends Component {
  constructor(props) {
    super(props);
    this.state = { rendered: null };
  }

  testFetch = async () => {
    let response = await fetch(
      'http://192.168.0.100:8081/gbr2svg/getSVG?job=ARDU'
    );
    let data = await response.json();
    console.log(data);
    //this.changeDOMSVG('front-data', data.BotLayer)
    //this.changeDOMSVG('back-data', data.TopLayer)
    this.changeDOMSVG('front-pcb', data.TopLayer);
    this.changeDOMSVG('back-pcb', data.BotLayer);
    return data;
  };

  changeDOMSVG = (side, data) => {
    this.removeDOMSVG(side);
    var object = document.getElementById(side);
    object.innerHTML = data;
    return;
  };

  addDOMSVG = (side, data) => {
    var object = document.getElementById(side);
    object.innerHTML = data;
  };

  removeDOMSVG = (side) => {
    var object = document.getElementById(side);
    object.innerHTML = '';
  };

  render() {
    return (
      <div className="sidebar">
        <Card title="test" className="sidebar">
          <Tabs
            size="small"
            defaultActiveKey="1"
            onChange={(key) => console.log(key)}
            centered
          >
            <TabPane tab="Jobs" key="1">
              <Button onClick={() => this.testFetch()}>Get PCB</Button>
            </TabPane>
            <TabPane tab="Layers" key="2">
              Content of Tab Pane 2
            </TabPane>
            <TabPane tab="Settings" key="3">
              <Row>
                <Col span={4} style={{padding: '5px'}}>
                  <VideoCameraOutlined />
                </Col>
                <Col span={20}>
                  <Select
                    defaultValue="perspective"
                    onChange={(value) => this.props.cameraSelector(value)}
                    style={{width: '100%'}}
                  >
                    <Option value="perspective">Perspective</Option>
                    <Option value="orthographic">Orthographic</Option>
                  </Select>
                </Col>
              </Row>
            </TabPane>
          </Tabs>
        </Card>
      </div>
    );
  }
}

export default SideBar;
