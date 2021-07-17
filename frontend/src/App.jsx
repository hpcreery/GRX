import React, { Component } from 'react'
import './Appcustom.css'
import Renderer from './components/Renderer'
import { version } from '../package.json'

const dotenv = require('dotenv')
dotenv.config()

class App extends Component {
  constructor(props) {
    super(props)
    this.state = { windowheight: window.innerHeight }
  }

  componentDidMount() {
    console.log(process.env)
  }

  render() {
    console.log('Rendering App', version)
    return (
      <div style={{ top: 0, left: 0, height: '100vh', width: '100vw', position: 'absolute' }}>
        <div style={{ margin: 0, height: '-webkit-fill-available' }}>
          <Renderer />
        </div>

        {/* <Card title='test' className='sidebar'>
          <Button onClick={() => this.testFetch()}>Hello</Button>
        </Card> */}
        <div className='icon-attribute'>
          <h6>!! DEVELOPMENT v{`${version}`} !!</h6>
          <h6>
            Software by{' '}
            <a target='_blank' rel='noreferrer' href='https://github.com/hpcreery'>
              Hunter Creery
            </a>{' '}
          </h6>
        </div>
      </div>
    )
  }
}

export default App
