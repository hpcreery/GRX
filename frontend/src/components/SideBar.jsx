// REACT
import React, { Component } from 'react'

// ANT DESIGN UI
import {
  Spin,
  Switch,
  Button,
  Card,
  Select,
  Tabs,
  Row,
  Col,
  List,
  Input,
  message,
  Popconfirm,
  Divider,
} from 'antd'
import { LoadingOutlined, VideoCameraOutlined, CloseCircleOutlined } from '@ant-design/icons'

// NPM PACKAGES
import { Resizable } from "re-resizable";

// CUSTOM
//import FetchArtwork from './functional/FetchArtwork'
import QualitySlider from './functional/QualitySlider'
import LayerListItem from './functional/LayerListItem'
import UnloadedLayerListItem from './functional/UnloadedLayerListItem'
import BlendMode from './functional/BlendMode'
import UploadModal from './functional/UploadModal'
import CreateJob from './functional/CreateJob'
import RulerKit from './functional/RulerKit'
import SelectKit from './functional/SelectKit'

// ANT DESIGN CONSTANTS
const { Option } = Select
const { TabPane } = Tabs
const { Search } = Input

// CONFIG
const { backendurl, port } = require('../config/config')

class SideBar extends Component {
  constructor(props) {
    super(props)
    this.state = {
      job: null,
      layers: [],
      rendered: null,
      loading: false,
      percent: 0,
      jobList: [],
      sidebarhidden: false,
      sidebar: 'sidebar',
      frontload: false,
      useoutline: true,
      objectSelection: null,
      coordinatesActive: false,
    }
  }

  fetchData = async (urlext, method) => {
    this.setState({ loading: true, percent: 0 })
    try {
      let response = await fetch(backendurl + port + urlext, { method: method || 'GET' })
      if (response.status !== 200) {
        console.error(response)
        //var err = 'Status: ' + response.status + ' => Message: ' + (await response.text()) // ADVANCED
        var err = await response.text()
        throw err
      }
      let data = await response.json()
      this.setState({ loading: false, percent: 100 })
      return data
    } catch (err) {
      this.setState({ loading: false })
      message.error('Error => ' + err)
      throw err
    }
  }

  fetchLayer = async (layer) => {
    var layerdata
    if (layer.name !== 'front' && layer.name !== 'back') {
      layerdata = await this.fetchData(`/gbr2svg/getLayerArtwork?job=${this.state.job}&layer=${layer.name}`)
    } else {
      layerdata = await this.fetchData(
        `/gbr2svg/getFinishedArtwork?job=${this.state.job}&outline=${this.state.useoutline}`
      )
      layerdata = Array(layerdata.find((data) => data.name === layer.name))
    }
    return layerdata
  }

  replaceArtwork = async (job) => {
    //this.props.clear()
    console.log('Getting Finished Artowrk for', job)
    var layerdata
    if (this.state.frontload === true) {
      layerdata = await this.fetchData(`/gbr2svg/getLayerArtwork?job=${job}`)
      var finisheddata = await this.fetchData(`/gbr2svg/getFinishedArtwork?job=${job}&outline=${this.state.useoutline}`)
      this.props.setJob(job, layerdata, finisheddata)
    } else if (this.state.frontload === false) {
      layerdata = await this.getLayerList(job)
      finisheddata = [
        {
          name: 'front',
          type: 'finished',
          side: 'top',
          svg: '',
        },
        {
          name: 'back',
          type: 'finished',
          side: 'bottom',
          svg: '',
        },
      ]
      this.props.setJob(job, layerdata, finisheddata)
    }
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
    let data = await this.fetchData(`/joblist?search=${search}`)
    var jobList = data.Jobs.map((job) => job.Name)
    this.setState({ jobList: jobList })
    return jobList
  }

  getLayerList = async (job) => {
    let data = await this.fetchData(`/gbr2svg/getLayerList?job=${job}`)
    return data
  }

  handleJobDelete = async (job) => {
    console.log(job)
    let data = await this.fetchData(`/job?job=${job}`, 'DELETE')
    this.getJobList('')
    console.log(data)
    return data
  }

  handleFrontLoad = (value) => {
    if (value === true) {
      this.replaceArtwork(this.state.job)
    }
    this.setState({ frontload: value })
  }

  handleUseOutline = (value) => {
    this.setState({ useoutline: value })
  }

  hideSidebar = () => {
    this.setState({ sidebarhidden: true, sidebar: 'sidebar-hidden' })
  }

  showSidebar = () => {
    this.setState({ sidebarhidden: false, sidebar: 'sidebar' })
  }

  render() {
    return (
      <div style={{ padding: '10px', width: '200px', height: '100%' }}>
        <Button
          type='text'
          className='togglesidebar'
          hidden={this.state.sidebarhidden}
          onClick={() => this.hideSidebar()}
        >
          HIDE
        </Button>
        <Button
          type='text'
          className='togglesidebar'
          hidden={!this.state.sidebarhidden}
          onClick={() => this.showSidebar()}
        >
          SHOW
        </Button>
        <Resizable
          style={{ padding: 0 }}
          defaultSize={{ height: '100%', width: '200px', }}
          enable={{ top: false, right: true, bottom: false, left: false, topRight: false, bottomRight: false, bottomLeft: false, topLeft: false }}
          maxWidth='400px'
          minWidth='200px'
        >

          <Card
            style={{
              backgroundColor: 'rgba(30, 30, 30, 0.85)',
              backdropFilter: 'blur(25px)',
              height: '100%',
              width: '-webkit-fill-available',
              transition: '0.5s ease',
              pointerEvents: 'all'
            }}
            bodyStyle={{
              height: 'calc(100% - 100px)',
              padding: '0px'
            }}
            title={
              this.state.loading ? <Spin indicator={<LoadingOutlined spin />} /> : this.state.job || 'GRX Gerber Renderer'
            }
            className={this.state.sidebar}
          >
            <Tabs animated={{ inkBar: true, tabPane: true }} size='small' defaultActiveKey='1' onChange={(key) => console.log(key)} centered>
              <TabPane tab='Jobs' key='1' >
                <Search placeholder='input search' onSearch={(value) => this.getJobList(value)} style={{ width: '-webkit-fill-available' }} />
                <div style={{ height: '100%', position: 'relative', overflowX: 'hidden', overflowY: 'scroll' }}>
                  <List
                    size='small'
                    header={
                      <Row style={{ margin: '0px' }}>
                        <Col span={15} style={{ padding: '0px 10px' }}>
                          <div>Job List</div>
                        </Col>
                        <Col span={9} style={{ padding: '0px', textAlign: 'right' }}>
                          <CreateJob
                            replaceArtwork={(job) => this.replaceArtwork(job)}
                            update={() => this.getJobList('')}
                          />
                        </Col>
                      </Row>
                    }
                    //bordered
                    dataSource={this.state.jobList}
                    renderItem={(jobname) => (
                      <List.Item style={{ padding: '5px 5px' }}>
                        <Button
                          type='link'
                          style={{ width: '90%', height: '27px' }}
                          onClick={() => this.replaceArtwork(jobname)}
                        >
                          {jobname}
                        </Button>
                        <Popconfirm
                          title='Are you sure delete this job?'
                          onConfirm={() => this.handleJobDelete(jobname)}
                          okText='Yes'
                          cancelText='No'
                        >
                          <CloseCircleOutlined />
                        </Popconfirm>
                      </List.Item>
                    )}
                  />
                </div>
              </TabPane>
              <TabPane tab='Layers' key='2' style={{ overflowX: 'hidden', overflowY: 'scroll', height: '100%' }}>
                <List
                  size='small'
                  header={
                    <Row style={{ margin: '0px' }}>
                      <Col span={15} style={{ padding: '0px 10px' }}>
                        <div>Layers</div>
                      </Col>
                      <Col span={9} style={{ padding: '0px', textAlign: 'right' }}>
                        <UploadModal replaceArtwork={(job) => this.replaceArtwork(job)} job={this.state.job} />
                      </Col>
                    </Row>
                  }
                  //bordered
                  dataSource={this.state.layers}
                  renderItem={(item) => (
                    <List.Item style={{ padding: '8px 8px' }}>
                      {this.state.frontload ? (
                        <LayerListItem key={item} layer={item} />
                      ) : (
                        <UnloadedLayerListItem
                          key={item}
                          layer={item}
                          add={(...props) => this.props.setSVGinDIV(...props)}
                          remove={(...props) => this.props.removeSVGinDIV(...props)}
                          fetchLayer={(...props) => this.fetchLayer(...props)}
                        />
                      )}
                    </List.Item>
                  )}
                />
                {/* <List
                size='small'
                header={<div>Steps</div>}
                //bordered
                dataSource={this.state.layerList}
                renderItem={(item) => <List.Item>{item}</List.Item>}
              /> */}
              </TabPane>
              <TabPane tab='Tools' key='3' forceRender style={{ overflowX: 'hidden', overflowY: 'scroll', height: '100%' }}>
                <Divider plain>Kit</Divider>
                <SelectKit />
                <RulerKit />
                <Divider plain>Settings</Divider>
                <Row style={{ margin: '5px ' }}>
                  <Col flex='30px' style={{ padding: '5px' }}>
                    <VideoCameraOutlined />
                  </Col>
                  <Col flex='auto'>
                    <Select
                      defaultValue='orthographic'
                      onChange={(value) => this.props.cameraSelector(value)}
                      style={{ width: '100%' }}
                    >
                      <Option value='perspective'>Perspective</Option>
                      <Option value='orthographic'>Orthographic</Option>
                    </Select>
                  </Col>
                </Row>
                <QualitySlider />
                <BlendMode />
                <Row style={{ margin: '5px ' }}>
                  <Col flex='auto' style={{ padding: '5px' }}>
                    Front Load
                  </Col>
                  <Col flex='30px' style={{ padding: '5px' }}>
                    <Switch
                      size='small'
                      checked={this.state.frontload}
                      onChange={(checked) => this.handleFrontLoad(checked)}
                    />
                  </Col>
                </Row>
                <Row style={{ margin: '5px ' }}>
                  <Col flex='auto' style={{ padding: '5px' }}>
                    Use Outline
                  </Col>
                  <Col flex='30px' style={{ padding: '5px' }}>
                    <Switch
                      size='small'
                      checked={this.state.useoutline}
                      onChange={(checked) => this.handleUseOutline(checked)}
                    />
                  </Col>
                </Row>
              </TabPane>
            </Tabs>
          </Card>
        </Resizable>
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
    console.log(state, props)
    if (props.job !== state.job || props.layers !== state.layers) {
      newState.job = props.job
      newState.layers = props.layers
      return newState
    } else {
      return null
    }
  }
}

export default SideBar

// DEPRECIATED METHODS
