import React, { Component } from 'react'
import { Spin, Switch, Alert, Button, Card } from 'antd'
import { LoadingOutlined } from '@ant-design/icons'
import './App.css'
import Renderer from './components/Renderer'

//const fs = window.require('fs');
const pcbStackup = require('pcb-stackup')
//require('./components/ThreeRenderer')
//require('./dev/main')

var parser = new DOMParser();

class App extends Component {
  constructor(props) {
    super(props)
    this.state = {}
    //three()
  }


  render() {
    console.log('Rendering App')
    return (
      <div className='elements'>
        <Renderer />
        {/* <Card title='test' className='sidebar'>
          <Button onClick={() => this.testFetch()}>Hello</Button>
        </Card> */}
      </div>
    )
  }
}

export default App
