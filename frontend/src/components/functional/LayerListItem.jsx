import React, { useState } from 'react';

import { Checkbox, Popover, Badge, Tooltip } from 'antd';
import { BgColorsOutlined } from '@ant-design/icons';
import { SketchPicker, BlockPicker, CirclePicker } from 'react-color';

const LayerListItem = (props) => {
  //var svgContainer = document.getElementById('svg-container')
  //var layerObject = svgContainer.childNodes.item(props.layer.name)
  //var layerObject = document.getElementById(props.layer.name)
  //console.log(props.layer)
  //console.log(layerObject)
  //var layerObject

  const [visible, setVisible] = useState(props.layer.visible);
  const [color, setColor] = useState('white');

  //console.log(svgContainer.childNodes.item(props.layer.name).style.color)
  const handleChange = (value) => {
    console.log(value);
    props.layer.visible = value;
    setVisible(value);
  };

  const handleColorChange = (color, event) => {
    var layerObject = document.getElementById(props.layer.name);
    console.log(color);
    console.log(layerObject);
    console.log(getComputedStyle(layerObject).getPropertyValue('color'));
    layerObject.style.color = `rgba(${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b}, 0.7)`;
    setColor(color.hex);
  };

  return (
    <div style={{ width: '100%' }}>
      <Checkbox
        checked={visible}
        onChange={(value) => handleChange(value.target.checked)}
        style={{ width: '90%' }}
      >
        <Tooltip placement="right" title={props.layer.name}>
          {props.layer.name.substring(0, 12)}
        </Tooltip>
      </Checkbox>
      <Popover
        content={
          <CirclePicker
            onChange={(color, event) => handleColorChange(color, event)}
          />
        }
        title="ColorPicker"
        placement="right"
        trigger="click"
      >
        <Badge color={color} />
      </Popover>
    </div>
  );
};

export default LayerListItem;

// <ClockCircleOutlined style={{ color: '#f5222d' }} />
// style={{ backgroundColor: color }}
// count={<BgColorsOutlined style={{ color: color }} />}
