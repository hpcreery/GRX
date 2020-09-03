import React, { Component } from 'react'
import { Spin, Switch, Alert } from 'antd'
import { LoadingOutlined } from '@ant-design/icons'
import './App.css'
import Renderer from './components/Renderer'

const fs = window.require('fs')
const pcbStackup = require('pcb-stackup')
//require('./components/ThreeRenderer')
require('./dev/main')

class App extends Component {
  constructor(props) {
    super(props)
    this.state = {}
    //three()
  }

  render() {
    console.log('Rendering App')
    return <div className='renderwrapper'>{/* <Renderer /> */}</div>
  }
}

export default App
