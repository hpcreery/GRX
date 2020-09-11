import React, { Component } from 'react';
import { Spin, Switch, Alert, Button, Card } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import './App.css';
import Renderer from './components/Renderer';

//const fs = window.require('fs');
const pcbStackup = require('pcb-stackup');
//require('./components/ThreeRenderer')
//require('./dev/main')

var parser = new DOMParser();

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {windowheight: window.innerHeight};
  }

  componentDidMount() {
    this.elements = document.getElementById("elements")
    window.addEventListener('resize', this.onWindowResize);
  }

  onWindowResize = () => {
    //console.log(this.elements)
    this.setState({windowheight: window.innerHeight})
    //this.elements.style.height = `${window.innerHeight}`
  };

  render() {
    console.log('Rendering App');
    return (
      <div className="elements" style={{height: this.state.windowheight}} id="elements">
        <Renderer />
        {/* <Card title='test' className='sidebar'>
          <Button onClick={() => this.testFetch()}>Hello</Button>
        </Card> */}
        <div className="icon-attribute">
        <h6>
          Software by{' '}
            <a target="_blank" href="https://github.com/hpcreery">
              Hunter Creery
            </a>{' '}
          </h6>
          <h6>
            <a target="_blank" href="https://icons8.com/icons/set/circuit">
              Circuit icon
            </a>{' '}
            icon by{' '}
            <a target="_blank" href="https://icons8.com">
              Icons8
            </a>
          </h6>
        </div>
      </div>
    );
  }
}

export default App;
