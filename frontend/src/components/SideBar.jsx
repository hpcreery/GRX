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
  List,
  Input,
} from 'antd';
import { LoadingOutlined, VideoCameraOutlined } from '@ant-design/icons';

// ANT DESIGN CONSTANTS
const { Option, OptGroup } = Select;
const { TabPane } = Tabs;
const { Search } = Input;

// TRACESPACE
const pcbStackup = require('pcb-stackup');

// BACKEND
const { backendurl } = require('../config/config');

class SideBar extends Component {
  constructor(props) {
    super(props);
    this.state = {
      rendered: null,
      jobList: [],
      jobLayers: [],
      sidebarhidden: false,
      sidebar: 'sidebar',
    };
  }

  testFetch = async () => {
    let response = await fetch(backendurl + '/gbr2svg/getExampleSVG?job=ARDU');
    let data = await response.json();
    console.log(data);
    //this.changeDOMSVG('front-data', data.BotLayer)
    //this.changeDOMSVG('back-data', data.TopLayer)
    this.changeDOMSVG('front-pcb', data.toplayer);
    this.changeDOMSVG('back-pcb', data.botlayer);
    return data;
  };

  replaceFinishedArtwork = async (job) => {
    console.log('Getting Finished Artowrk for', job);
    let response = await fetch(
      backendurl + `/gbr2svg/getFinishedArtwork?job=${job}`
    );
    let data = await response.json();
    console.log(data);
    //this.changeDOMSVG('front-data', data.BotLayer)
    //this.changeDOMSVG('back-data', data.TopLayer)
    this.changeDOMSVG('front-pcb', data.toplayer);
    this.changeDOMSVG('back-pcb', data.botlayer);
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

  getJobList = async (search) => {
    let response = await fetch(
      backendurl + `/odbinfo/getJobList?search=${search}`
    );
    let data = await response.json();
    var jobList = data.Jobs.map((job) => job.Name);
    this.setState({ jobList: jobList });
    return jobList;
  };

  hideSidebar = () => {
    this.setState({ sidebarhidden: true, sidebar: 'sidebar-hidden' });
  };

  showSidebar = () => {
    this.setState({ sidebarhidden: false, sidebar: 'sidebar' });
  };

  render() {
    return (
      <div className="sidebarcontainer">
        <Button
          type="link"
          className="togglesidebar"
          hidden={this.state.sidebarhidden}
          onClick={() => this.hideSidebar()}
        >
          HIDE
        </Button>
        <Button
          type="link"
          className="togglesidebar"
          hidden={!this.state.sidebarhidden}
          onClick={() => this.showSidebar()}
        >
          SHOW
        </Button>

        <Card title="GRX Gerber Renderer" className={this.state.sidebar}>
          <Tabs
            size="small"
            defaultActiveKey="1"
            onChange={(key) => console.log(key)}
            centered
          >
            <TabPane tab="Jobs" key="1" className="tabpane">
              <Search
                placeholder="input search"
                onSearch={(value) => this.getJobList(value)}
                style={{ width: 178 }}
              />
              <div className="sidebarlist">
                <List
                  size="small"
                  header={<div>Job List</div>}
                  //bordered
                  dataSource={this.state.jobList}
                  renderItem={(jobname) => (
                    <List.Item style={{ padding: '5px 5px' }}>
                      <Button
                        type="link"
                        style={{ width: '100%' }}
                        onClick={() =>
                          this.replaceFinishedArtwork(jobname)
                        }
                      >
                        {jobname}
                      </Button>
                    </List.Item>
                  )}
                />
              </div>
            </TabPane>
            <TabPane tab="Layers" key="2">
              <List
                size="small"
                header={<div>Steps</div>}
                //bordered
                dataSource={this.state.jobLayers}
                renderItem={(item) => <List.Item>{item}</List.Item>}
              />
              <List
                size="small"
                header={<div>Layers</div>}
                //bordered
                dataSource={this.state.jobLayers}
                renderItem={(item) => <List.Item>{item}</List.Item>}
              />
            </TabPane>
            <TabPane tab="Settings" key="3">
              <Row>
                <Col span={4} style={{ padding: '5px' }}>
                  <VideoCameraOutlined />
                </Col>
                <Col span={20}>
                  <Select
                    defaultValue="perspective"
                    onChange={(value) => this.props.cameraSelector(value)}
                    style={{ width: '100%' }}
                  >
                    <Option value="perspective">Perspective</Option>
                    <Option value="orthographic">Orthographic</Option>
                  </Select>
                  <Button onClick={() => this.testFetch()}>Get Sample</Button>
                  <Button onClick={() => this.getJobList('')}>Get Jobs</Button>
                </Col>
              </Row>
            </TabPane>
          </Tabs>
        </Card>
      </div>
    );
  }

  componentDidMount() {
    this.getJobList('');
  }
}

export default SideBar;
