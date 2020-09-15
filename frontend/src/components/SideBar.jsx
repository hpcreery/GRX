// React
import React, { Component } from 'react'

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
  Slider,
  Radio,
  Checkbox,
  message,
} from 'antd'
import { LoadingOutlined, VideoCameraOutlined, FormatPainterOutlined } from '@ant-design/icons'

// ANT DESIGN CONSTANTS
const { Option, OptGroup } = Select
const { TabPane } = Tabs
const { Search } = Input

// TRACESPACE
const pcbStackup = require('pcb-stackup')

// CUSTOM
//import FetchArtwork from './functional/FetchArtwork'
import QualitySlider from './functional/QualitySlider'
import LayerListItem from './functional/LayerListItem'

// BACKEND
const { backendurl } = require('../config/config')

class SideBar extends Component {
  constructor(props) {
    super(props)
    this.state = {
      job: null,
      layers: [],
      rendered: null,
      jobList: [],
      sidebarhidden: false,
      sidebar: 'sidebar',
    }
  }

  fetchData = async (urlext) => {
    try {
      let response = await fetch(backendurl + urlext)
      if (response.status !== 200) {
        console.error(response)
        var err = 'Status: ' + response.status + ' Message: ' + (await response.text())
        throw err
      }
      let data = await response.json()
      return data
    } catch (err) {
      message.error('Server Error => ' + err)
      throw err
    }
  }

  testFetch = async () => {
    let data = await this.fetchData('/gbr2svg/getFinishedArtowrk?job=ARDU')
    this.changeDOMSVG('front-pcb', data.toplayer)
    this.changeDOMSVG('back-pcb', data.botlayer)
    return
  }

  replaceArtwork = async (job) => {
    //this.props.clear()
    console.log('Getting Finished Artowrk for', job)

    let finisheddata = await this.fetchData(`/gbr2svg/getFinishedArtwork?job=${job}`)
    let layerdata = await this.fetchData(`/gbr2svg/getLayerArtwork?job=${job}`)
    //let data = await response.json()
    console.log(finisheddata)
    console.log(layerdata)
    this.props.setJob(job, layerdata, finisheddata)
    //this.changeDOMSVG('front-data', data.BotLayer)
    //this.changeDOMSVG('back-data', data.TopLayer)
    //this.changeDOMSVG('front-pcb', data.toplayer)
    //this.changeDOMSVG('back-pcb', data.botlayer)
    // data.forEach((layer) => {
    //   console.log(layer)
    //   this.props.addLayer(layer)
    // })

    return
  }

  changeDOMSVG = (side, data) => {
    this.removeDOMSVG(side)
    var object = document.getElementById(side)
    object.innerHTML = data
    return
  }

  addDOMSVG = (side, data) => {
    var object = document.getElementById(side)
    object.innerHTML = data
  }

  removeDOMSVG = (side) => {
    var object = document.getElementById(side)
    object.innerHTML = ''
  }

  getJobList = async (search) => {
    let response = await fetch(backendurl + `/odbinfo/getJobList?search=${search}`)
    let data = await response.json()
    var jobList = data.Jobs.map((job) => job.Name)
    this.setState({ jobList: jobList })
    return jobList
  }

  hideSidebar = () => {
    this.setState({ sidebarhidden: true, sidebar: 'sidebar-hidden' })
  }

  showSidebar = () => {
    this.setState({ sidebarhidden: false, sidebar: 'sidebar' })
  }

  render() {
    return (
      <div className='sidebarcontainer'>
        <Button
          type='link'
          className='togglesidebar'
          hidden={this.state.sidebarhidden}
          onClick={() => this.hideSidebar()}
        >
          HIDE
        </Button>
        <Button
          type='link'
          className='togglesidebar'
          hidden={!this.state.sidebarhidden}
          onClick={() => this.showSidebar()}
        >
          SHOW
        </Button>

        <Card title={this.state.job  || 'GRX Gerber Renderer'} className={this.state.sidebar}>
          <Tabs size='small' defaultActiveKey='1' onChange={(key) => console.log(key)} centered>
            <TabPane tab='Jobs' key='1' className='tabpane'>
              <Search placeholder='input search' onSearch={(value) => this.getJobList(value)} style={{ width: 178 }} />
              <div className='sidebarlist'>
                <List
                  size='small'
                  header={<div>Job List</div>}
                  //bordered
                  dataSource={this.state.jobList}
                  renderItem={(jobname) => (
                    <List.Item style={{ padding: '5px 5px' }}>
                      <Button
                        type='link'
                        style={{ width: '100%', height: '27px' }}
                        onClick={() => this.replaceArtwork(jobname)}
                      >
                        {jobname}
                      </Button>
                    </List.Item>
                  )}
                />
              </div>
            </TabPane>
            <TabPane tab='Layers' key='2'>
              <List
                size='small'
                header={<div>Layers</div>}
                //bordered
                dataSource={this.state.layers}
                renderItem={(item) => (
                  <List.Item style={{ padding: '8px 8px' }}>
                    <LayerListItem layer={item} />
                  </List.Item>
                )}
              />
              <List
                size='small'
                header={<div>Steps</div>}
                //bordered
                dataSource={this.state.layerList}
                renderItem={(item) => <List.Item>{item}</List.Item>}
              />
            </TabPane>
            <TabPane tab='Settings' key='3'>
              <Row>
                <Col span={4} style={{ padding: '5px' }}>
                  <VideoCameraOutlined />
                </Col>
                <Col span={20}>
                  <Select
                    defaultValue='perspective'
                    onChange={(value) => this.props.cameraSelector(value)}
                    style={{ width: '100%' }}
                  >
                    <Option value='perspective'>Perspective</Option>
                    <Option value='orthographic'>Orthographic</Option>
                  </Select>
                </Col>
              </Row>
              <Row>
                <Col span={4} style={{ padding: '5px' }}>
                  <FormatPainterOutlined />
                </Col>
                <Col span={20}>
                  <QualitySlider />
                </Col>
              </Row>
              {/* <Row>
                <Col span={4} style={{ padding: '5px' }}>
                  <FormatPainterOutlined />
                </Col>
                <Col span={20}>
                  <Button onClick={() => this.testFetch()}>Get Sample</Button>
                  <Button onClick={() => this.getJobList('')}>Get Jobs</Button>
                </Col>
              </Row> */}
            </TabPane>
          </Tabs>
        </Card>
      </div>
    )
  }

  componentDidMount() {
    this.getJobList('')
  }

  componentDidUpdate() {
    console.log('updated')
  }

  static getDerivedStateFromProps(props, state) {
    var newState = {}
    if (props.job !== state.job) {
      console.log('New Job')
      newState.job = props.job
    }
    if (props.layers !== state.layers) {
      //var layerlist = props.layers.map((object) => object.name)
      //console.log('New Layers')
      newState.layers = props.layers
      //state.layerList = layerlist
    }
    console.log(state)
    console.log(newState)
    return newState
  }
}

export default SideBar
