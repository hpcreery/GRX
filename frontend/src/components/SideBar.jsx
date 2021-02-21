// REACT
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
  Progress,
  Popconfirm,
  Divider,
  Typography,
} from 'antd'
import { LoadingOutlined, VideoCameraOutlined, FormatPainterOutlined, CloseCircleOutlined } from '@ant-design/icons'

// ANT DESIGN CONSTANTS
const { Option, OptGroup } = Select
const { TabPane } = Tabs
const { Search } = Input
const { Text, Link } = Typography

// TRACESPACE
const pcbStackup = require('pcb-stackup')

// SVGJS
import SVG from 'svg.js'

// CUSTOM
//import FetchArtwork from './functional/FetchArtwork'
import QualitySlider from './functional/QualitySlider'
import LayerListItem from './functional/LayerListItem'
import UnloadedLayerListItem from './functional/UnloadedLayerListItem'
import BlendMode from './functional/BlendMode'
import UploadModal from './functional/UploadModal'
import CreateJob from './functional/CreateJob'
import MouseActions from './functional/MouseActions'

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
    // ;(this.drawBoardSize = 100000), (this.drawBoardScale = 0.1), (this.svgContainer = props.svgContainer)
    // this.drawContainer = props.drawContainer
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
    if (layer.name !== 'front' && layer.name !== 'back') {
      var layerdata = await this.fetchData(`/gbr2svg/getLayerArtwork?job=${this.state.job}&layer=${layer.name}`)
    } else {
      var layerdata = await this.fetchData(
        `/gbr2svg/getFinishedArtwork?job=${this.state.job}&outline=${this.state.useoutline}`
      )
      layerdata = Array(layerdata.find((data) => data.name == layer.name))
    }
    return layerdata
  }

  replaceArtwork = async (job) => {
    //this.props.clear()
    console.log('Getting Finished Artowrk for', job)

    if (this.state.frontload === true) {
      var layerdata = await this.fetchData(`/gbr2svg/getLayerArtwork?job=${job}`)
      var finisheddata = await this.fetchData(`/gbr2svg/getFinishedArtwork?job=${job}&outline=${this.state.useoutline}`)
      this.props.setJob(job, layerdata, finisheddata)
    } else if (this.state.frontload === false) {
      var layerdata = await this.getLayerList(job)
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

  objectSelectionKit = (layer) => {
    this.props.drawContainer.innerHTML = ''
    //let svgContainer = document.getElementById('svg-container')
    //let divLayer = a // divLayer.id = layer.name
    //var svgChildElement = divLayer.childNodes[0]
    var svgChildElement = this.props.svgContainer.querySelector('div > svg')
    let svgElements = svgChildElement.querySelectorAll('g > *')
    console.log(svgElements)
    //svgElement.addEventListener('mouseover', (e) => console.log(e))
    let initColor
    svgElements.forEach((node) => {
      initColor = node.style.color
      let g
      node.onmouseover = (e) => {
        e.target.style.color = '#08979c'

        if (node.nodeName == 'path') {
          g = {
            type: node.nodeName,
            g: 'path',
            lineWidth: node.attributes['stroke-width'] ? node.attributes['stroke-width'].value : 0,
            code: node.attributes.d.value,
            attr: node.attributes,
          }
        } else if (node.nodeName == 'use') {
          g = {
            type: node.nodeName,
            g: 'pad',
            x: node.attributes.x.value,
            y: node.attributes.y.value,
            shape: node.attributes['xlink:href'].value,
            attr: node.attributes,
          }
        }
        console.log(g)
        let infoBar = document.getElementById('bottom-info-bar')
        let oldInfo = infoBar.childNodes[0]
        let info = document.createElement('h4')
        info.innerHTML = g
          ? g.g == 'path'
            ? `SURFACE/LINE | Line Width: ${g.lineWidth}`
            : `PAD | X: ${g.x} Y: ${g.y} Shape: ${g.shape}`
          : 'NA'
        infoBar.replaceChild(info, oldInfo)
        this.setState({ objectSelection: g })
      }

      node.onmouseleave = (e) => {
        e.target.style.color = initColor
      }
    })
    this.props.svgContainer.onclick = (e) => {
      e.target.style.color = initColor
      var old_element = svgChildElement
      var new_element = old_element.cloneNode(true)
      old_element.parentNode.replaceChild(new_element, old_element)
    }
  }

  handleMouseLocation = (event, action) => {
    console.log('CLICK')
    let mouseCoordinates = { pixel: { x: 0, y: 0 }, inch: { x: 0, y: 0 }, mm: { x: 0, y: 0 }, draw: { x: 0, y: 0 } }
    mouseCoordinates.pixel.x = (event.offsetX - this.props.drawBoardSize / 2) * this.props.drawBoardScale
    mouseCoordinates.pixel.y = -((event.offsetY - this.props.drawBoardSize / 2) * this.props.drawBoardScale)
    mouseCoordinates.inch.x = mouseCoordinates.pixel.x / 96
    mouseCoordinates.inch.y = mouseCoordinates.pixel.y / 96
    mouseCoordinates.mm.x = mouseCoordinates.inch.x * 24
    mouseCoordinates.mm.y = mouseCoordinates.inch.y * 24
    mouseCoordinates.draw.x = event.offsetX
    mouseCoordinates.draw.y = event.offsetY
    action(mouseCoordinates)

    // Slow, but usefule in a different funtion.
    // this.setState({
    //   mouseCoordinates,
    // })
  }

  handeMouseFeatures = () => {
    this.props.drawContainer.innerHTML = ''
    //console.log(document.getElementById('draw-board'))
    this.drawing = SVG(this.props.drawContainer.id).size(this.props.drawBoardSize, this.props.drawBoardSize)
    let svgChildElement = this.props.drawContainer.childNodes[0]
    svgChildElement.style.top = `-${this.props.drawBoardSize / 2}px`
    svgChildElement.style.left = `-${this.props.drawBoardSize / 2}px`
    svgChildElement.style.position = `relative`
    svgChildElement.style.transformOrigin = `center`
    svgChildElement.style.transform = `scale(${this.props.drawBoardScale})`
    svgChildElement.style.cursor = 'crosshair'
    this.props.drawContainer.addEventListener('click', (e) => this.handleMouseLocation(e, this.ruler), { once: true })
  }

  ruler = (coordinates) => {
    console.log(coordinates)
    let startPosition = coordinates
    let line = this.drawing
      .line(coordinates.draw.x, coordinates.draw.y, coordinates.draw.x, coordinates.draw.y)
      .stroke({ color: 'white', width: 3, linecap: 'round' })
    var text = this.drawing.text(`DX:0 DY:0 D:0`).click((e) => console.log(e))
    text.font({ fill: 'white', family: 'Inconsolata', size: 50 })
    let lineDrawing = (e) => {
      this.handleMouseLocation(e, (coordinates) => {
        line.attr({ x2: coordinates.draw.x, y2: coordinates.draw.y })
        text
          .move(coordinates.draw.x, coordinates.draw.y)
          .text(
            `DX:${(coordinates.inch.x - startPosition.inch.x).toFixed(5)} DY:${(
              coordinates.inch.y - startPosition.inch.y
            ).toFixed(5)} D:${Math.sqrt(
              Math.pow(coordinates.inch.x - startPosition.inch.x, 2) +
                Math.pow(coordinates.inch.y - startPosition.inch.y, 2)
            ).toFixed(5)}`
          )
      })
    }
    this.props.drawContainer.addEventListener('mousemove', lineDrawing)
    this.props.drawContainer.addEventListener('click', (e) => {
      this.props.drawContainer.removeEventListener('mousemove', lineDrawing)
    })
  }

  setUpKeyboardEvents = () => {
    let doc_keyUp = (e) => {
      if (e.altKey && e.key === 'r') {
        this.handeMouseFeatures()
      }
    }
    document.addEventListener('keyup', doc_keyUp, false)
  }

  render() {
    return (
      <div className='sidebarcontainer'>
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

        <Card
          title={
            this.state.loading ? <Spin indicator={<LoadingOutlined spin />} /> : this.state.job || 'GRX Gerber Renderer'
          }
          className={this.state.sidebar}
        >
          <Tabs size='small' defaultActiveKey='1' onChange={(key) => console.log(key)} centered>
            <TabPane tab='Jobs' key='1' className='tabpane'>
              <Search placeholder='input search' onSearch={(value) => this.getJobList(value)} style={{ width: 178 }} />
              <div className='sidebarlist'>
                <List
                  size='small'
                  header={
                    <Row style={{ margin: '0px' }}>
                      <Col span={15} style={{ padding: '0px 10px' }}>
                        <div>Job List</div>
                      </Col>
                      <Col span={9} style={{ padding: '0px' }}>
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
            <TabPane tab='Layers' key='2'>
              <List
                size='small'
                header={
                  <Row style={{ margin: '0px' }}>
                    <Col span={15} style={{ padding: '0px 10px' }}>
                      <div>Layers</div>
                    </Col>
                    <Col span={9} style={{ padding: '0px' }}>
                      <UploadModal replaceArtwork={(job) => this.replaceArtwork(job)} job={this.state.job} />
                    </Col>
                  </Row>
                }
                //bordered
                dataSource={this.state.layers}
                renderItem={(item) => (
                  <List.Item style={{ padding: '8px 8px' }}>
                    {this.state.frontload ? (
                      <LayerListItem layer={item} />
                    ) : (
                      <UnloadedLayerListItem
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
            <TabPane tab='Tools' key='3'>
              <Divider plain>Kit</Divider>

              <Button type='text' style={{ width: '100%' }} onClick={() => this.objectSelectionKit()}>
                Select .<Text type='secondary'>(alt+s)</Text>
              </Button>
              <Button type='text' style={{ width: '100%' }} onClick={() => this.handeMouseFeatures()}>
                Ruler .<Text type='secondary'>(alt+r)</Text>
              </Button>
              <Divider plain>Settings</Divider>
              <Row style={{ margin: '5px ' }}>
                <Col span={4} style={{ padding: '5px' }}>
                  <VideoCameraOutlined />
                </Col>
                <Col span={20}>
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
                <Col span={18} style={{ padding: '5px' }}>
                  Front Load
                </Col>
                <Col span={6} style={{ padding: '5px' }}>
                  <Switch
                    size='small'
                    checked={this.state.frontload}
                    onChange={(checked) => this.handleFrontLoad(checked)}
                  />
                </Col>
              </Row>
              <Row style={{ margin: '5px ' }}>
                <Col span={18} style={{ padding: '5px' }}>
                  Use Outline
                </Col>
                <Col span={6} style={{ padding: '5px' }}>
                  <Switch
                    size='small'
                    checked={this.state.useoutline}
                    onChange={(checked) => this.handleUseOutline(checked)}
                  />
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
        {this.props.svgContainer ? (
          <MouseActions
            drawBoardSize={this.props.drawBoardSize}
            drawBoardScale={this.props.drawBoardScale}
            drawContainer={this.props.drawContainer}
            render={(coordinates) => (
              <h4>{`${coordinates.inch.x.toFixed(5)}in, ${coordinates.inch.y.toFixed(5)}in`}</h4>
            )}
          />
        ) : (
          <h1>loading</h1>
        )}
      </div>
    )
  }

  componentDidMount() {
    this.getJobList('')
    //this.initDrawBoard()
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
    // if (props.layers !== state.layers) {

    // }
    //console.log(state)
    //console.log(newState)
  }
}

export default SideBar

// DEPRECIATED METHODS
/*

  testFetch = async () => {
    let data = await this.fetchData('/gbr2svg/getFinishedArtowrk?job=ARDU')
    this.changeDOMSVG('front-pcb', data.toplayer)
    this.changeDOMSVG('back-pcb', data.botlayer)
    return
  }



  */
