import React, { Component } from 'react'
import { Spin, Switch, Alert, Button, Card } from 'antd'
import { LoadingOutlined } from '@ant-design/icons'
import './App.css'
import Renderer from './components/Renderer'

const dotenv = require('dotenv')
dotenv.config()
import { version } from '../package.json'

class App extends Component {
  constructor(props) {
    super(props)
    this.state = { windowheight: window.innerHeight }
  }

  componentDidMount() {
    this.elements = document.getElementById('elements')
    window.addEventListener('resize', this.onWindowResize)
    console.log(process.env)
  }

  onWindowResize = () => {
    this.setState({ windowheight: window.innerHeight })
  }

  render() {
    console.log('Rendering App', version)
    return (
      <div className='elements' style={{ height: this.state.windowheight }} id='elements'>
        <Renderer />
        {/* <Card title='test' className='sidebar'>
          <Button onClick={() => this.testFetch()}>Hello</Button>
        </Card> */}
        <div className='icon-attribute'>
          <h6>!! DEVELOPMENT v{`${version}`} !!</h6>
          <h6>
            Software by{' '}
            <a target='_blank' href='https://github.com/hpcreery'>
              Hunter Creery
            </a>{' '}
          </h6>
        </div>
      </div>
    )
  }
}

export default App
