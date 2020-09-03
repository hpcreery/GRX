import React, { Component } from 'react'
import { Spin, Switch, Alert } from 'antd'
import { LoadingOutlined } from '@ant-design/icons'

const fs = window.require('fs')
const pcbStackup = require('pcb-stackup')

class Renderer extends Component {
  constructor(props) {
    super(props)
    this.state = { rendered: null }
  }
  gerbeRender = () => {
    console.log('Initialting Method gerberRender()')
    const fileNames = [
      '././public/ArduinoGerbers/UNO.GTL',
      '././public/ArduinoGerbers/UNO.GTS',
      '././public/ArduinoGerbers/UNO.GTO',
      '././public/ArduinoGerbers/UNO.GTP',
      '././public/ArduinoGerbers/UNO.GBL',
      '././public/ArduinoGerbers/UNO.GBS',
      '././public/ArduinoGerbers/UNO.GBO',
      '././public/ArduinoGerbers/UNO.GBP',
      '././public/ArduinoGerbers/UNO.GML',
      '././public/ArduinoGerbers/UNO.dri',
      '././public/ArduinoGerbers/UNO.brd',
    ]

    const layers = fileNames.map((filename) => ({
      filename,
      gerber: fs.createReadStream(filename),
    }))

    pcbStackup(layers, { useOutline: true }).then((stackup) => {
      console.log(stackup)
      console.log(stackup.bottom.svg) // logs "<svg ... </svg>"
      //console.log(stackup.bottom.svg) // logs "<svg ... </svg>"
      this.toplayer = stackup.top.svg
      this.botlayer = stackup.bottom.svg
      this.setState({ rendered: true })
    })
  }

  stringToHTML = (str) => {
    var parser = new DOMParser()
    var doc = parser.parseFromString(str, 'text/html')
    return doc.body
  }

  topreturner = () => {
    return this.state.rendered ? this.toplayer : '<span>LOADING</span>'
  }
  botreturner = () => {
    return this.state.rendered ? this.botlayer : '<span>LOADING</span>'
  }

  componentDidMount() {
    this.gerbeRender()
  }

  render() {
    console.log('Rendering Renderer')
    return (
      <div className='flip-card'>
        <div className='flip-card-inner'>
          <div className='flip-card-front' dangerouslySetInnerHTML={{ __html: this.topreturner() }}></div>
          <div className='flip-card-back' dangerouslySetInnerHTML={{ __html: this.botreturner() }}></div>
        </div>
      </div>
    )
  }
}

export default Renderer
