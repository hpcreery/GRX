// Basic Functions for Writing and Reading IPC-356A Netlist Files.

// # Standard
// Groups: 1:op-code 2:NET 3:point 4:mid? 5:drill? 6:drill-size 7:plated/unplated 8:side 9:x 10:y
// ^(\d{3})(\S+?)\s{1,13}\s(\S+)?\s*[-\s].{4}([M\s])(?:(?:(D)(\d{4})(P|U))?|\s{6})A(.{2})X([\+\-\s]\d{6})Y([\+\-\s]\d{6})
// # Extended
// # Resistance
// ## First Record
// Groups: 1:op - code 2:NET 3:side 4:X 5:Y 6:type 7:res 8:high 9:low 10:name
// ^(3[78]0)(\S+?)\s{1,13}\sA(\d{2})\sX([\+\-\s]\d{6})Y([\+\-\s]\d{6})\s([CRL])\s(\d{4}E[\+\-]\d) (\d{4}E[\+\-]\d)\s(\d{4}E[\+\-]\d)\s(\S+)
// ## Second Record
// Groups: 1:op-code 2:NET 3:side 4:X 5:Y 6:X-resistor 7:Y-resistor 8:x-dim 9:y:dim 10:res-layer
// ^(0[78]0)(\S+?)\s{1,13}\sA(\d{2})\sX([\+\-\s]\d{6})Y([\+\-\s]\d{6})\sX([\+\-\s]\d{6})Y([\+\-\s]\d{6})\sX(\d{4})Y(\d{4})\sL(\d{2})
// # Adjacency
// ## First Record
// Groups: 1:op-code 2:NET 3:adj-nets
// ^(379)(\S+\s)(.+)
// ## Contine Records
// Groups: 1:op-code 2:adj-nets
// ^(079)(.+)

// Groups: 1:op-code 2:NET 3:point 4:mid? 5:drill? 6:drill-size 7:plated/unplated 8:side 9:x 10:y
const standard =
  /^(\d{3})(\S+?)\s{1,13}\s(\S+)?\s*[-\s].{4}([M\s])(?:(?:(D)(\d{4})(P|U))?|\s{6})A(.{2})X([\+\-\s]\d{6})Y([\+\-\s]\d{6})/
// Groups: 1:op - code 2:NET 3:side 4:X 5:Y 6:type 7:res 8:low 9:high 10:name
const component =
  /^(3[78]0)(\S+?)\s{1,13}\sA(\d{2})\sX([\+\-\s]\d{6})Y([\+\-\s]\d{6})\s([CRL])\s(\d{4}E[\+\-]\d) (\d{4}E[\+\-]\d)\s(\d{4}E[\+\-]\d)\s(\S+)/
// Groups: 1:op-code 2:NET 3:side 4:X 5:Y 6:X-resistor 7:Y-resistor 8:x-dim 9:y:dim 10:res-layer
const compcont =
  /^(0[78]0)(\S+?)\s{1,13}\sA(\d{2})\sX([\+\-\s]\d{6})Y([\+\-\s]\d{6})\sX([\+\-\s]\d{6})Y([\+\-\s]\d{6})\sX(\d{4})Y(\d{4})\sL(\d{2})/
// Groups: 1:op-code 2:NET 3:adj-net
const adjacency = /^(379)(\S+\s)(.+)/
// Groups: 1:op-code 2:adj-net
const adjacont = /^(079)(.+)/

export const dataParse = async (data) => {
  let records = data.split(/\r?\n/)
  let base = []
  let ref = null
  for (let i = 1; i < records.length; i++) {
    let jsonrecord = null
    let results
    if (records[i].match(standard) !== null) {
      results = records[i].match(standard)
      let point = results[3] ? Number(results[3]) : undefined
      let drill_size = results[6] ? Number(results[6]) / 10000 : undefined
      let drill = results[5] ? true : false
      let x = results[9] ? Number(results[9]) / 10000 : undefined
      let y = results[10] ? Number(results[10]) / 10000 : undefined
      let side = results[8] ? Number(results[8]) : undefined
      let mid = results[4] ? true : false
      jsonrecord = {
        op_code: results[1],
        net: results[2],
        point: point,
        mid: mid,
        drill: drill,
        drill_size: drill_size,
        drill_type: results[7],
        side: side,
        x_text: results[9],
        y_text: results[10],
        x: x,
        y: y,
      }
      base.push(jsonrecord)
    } else if (records[i].match(component) !== null) {
      results = records[i].match(component)
      let x = results[4] ? Number(results[4]) / 10000 : undefined
      let y = results[5] ? Number(results[5]) / 10000 : undefined
      let side = results[3] ? Number(results[3]) : undefined
      let value = results[7] ? Number(results[7]) : undefined
      let high = results[9] ? Number(results[9]) : undefined
      let low = results[8] ? Number(results[8]) : undefined
      ref = results[10]
      jsonrecord = {
        op_code: results[1],
        net: results[2],
        side: side,
        x_text: results[4],
        y_text: results[5],
        x: x,
        y: y,
        type: results[6],
        value: value,
        high: high,
        low: low,
        name: results[10],
      }
      base.push(jsonrecord)
    } else if (records[i].match(compcont) !== null) {
      results = records[i].match(compcont)
      let side = results[3] ? Number(results[3]) : undefined
      let x = results[4] ? Number(results[4]) / 10000 : undefined
      let y = results[5] ? Number(results[5]) / 10000 : undefined
      let x_component = results[6] ? Number(results[6]) / 10000 : undefined
      let y_component = results[7] ? Number(results[7]) / 10000 : undefined
      let x_dim = results[8] ? Number(results[8]) / 10000 : undefined
      let y_dim = results[9] ? Number(results[9]) / 10000 : undefined
      let layer = results[10] ? Number(results[10]) : undefined
      jsonrecord = {
        op_code: results[1],
        net: results[2],
        side: side,
        x_text: results[4],
        y_text: results[5],
        x: x,
        y: y,
        x_component: x_component,
        y_component: y_component,
        x_dim: x_dim,
        y_dim: y_dim,
        layer: layer,
        name: ref,
      }
      base.push(jsonrecord)
    } else if (records[i].match(adjacency) !== null) {
      results = records[i].match(adjacency)
      ref = results[2]
      let adj = results[3] ? results[3].split(' ') : undefined
      adj = adj.filter((word) => word !== '')
      jsonrecord = { op_code: results[1], net: results[2], adj: adj }
      base.push(jsonrecord)
    } else if (records[i].match(adjacont) !== null) {
      results = records[i].match(adjacont)
      let adj = results[2] ? results[2].split(' ') : undefined
      adj = adj.filter((word) => word !== '')
      jsonrecord = { op_code: results[1], net: ref, adj: adj }
      base.push(jsonrecord)
    }
  }
  console.log(base)
  return base
}

export const getHeader = async (data) => {}

export const recordCount = async (data) => {
  if (data) {
    let result = data.split(/\r?\n/)
    return result.length
  } else {
    throw 'No records to parse in recordCount function'
  }
}

export const getMetrics = async (records) => {
  if (records) {
    let stats = { nets: 0, points: 0, adjacencies: 0, components: 0 }
    let points = []
    let nets = []
    for (var i = 0; i < records.length; i++) {
      if (
        records[i].op_code == '317' ||
        records[i].op_code == '327' ||
        records[i].op_code == '017' ||
        records[i].op_code == '027'
      ) {
        points.push(records[i].point ? records[i].point : 0)
        nets.push(records[i].net)
      }
      if (records[i].op_code == '379' || records[i].op_code == '079') {
        stats.adjacencies = stats.adjacencies + records[i].adj.length
      }
      if (records[i].op_code == '370' || records[i].op_code == '380') {
        stats.components++
      }
    }
    stats.points = Math.max(...points)
    let uniquenets = [...new Set(nets)]
    stats.nets = uniquenets.length
    return stats
  } else {
    throw 'No records to parse in getMetrics function'
  }
}

export const getNets = async (records) => {
  if (records) {
    let nets = []
    for (var i = 0; i < records.length; i++) {
      if (
        records[i].op_code == '317' ||
        records[i].op_code == '327' ||
        records[i].op_code == '017' ||
        records[i].op_code == '027'
      ) {
        nets.push(records[i].net)
      }
    }
    let uniquenets = [...new Set(nets)]
    return uniquenets
  } else {
    throw 'No records to parse in getNets function'
  }
}

export const adjDelete = async (data, adjacency) => {
  let count = 0
  let chunks = []
  for (var i = 0; i < adjacency.length; i++) {
    let found = false
    for (var c = 0; c < chunks.length; c++) {
      found = false
      if (chunks[c].some((v) => adjacency[i].indexOf(v) >= 0)) {
        found = true
        chunks[c].push(...adjacency[i])
        chunks[c] = [...new Set(chunks[c])]
        break
      }
    }
    if (!found) {
      chunks.push(adjacency[i])
    }
  }
  console.log(chunks)
  for (var c = 0; c < chunks.length; c++) {
    let set1 = chunks[c].join('|')
    let set2 = chunks[c].join('\\s|')
    let reg = `(379(?:${set1}).*(\\r?\\n079.*?)*)(${set2}\\s)`
    var regAdj = new RegExp(reg, 'gm')
    console.log(reg)
    while (regAdj.exec(data) !== null) {
      count++
      data = data.replace(regAdj, '$1')
    }
  }

  // DEPRECIATED FUNCTION CODE || REPACED WITH ^
  // for (var i = 0; i < adjacency.length; i++) {
  //   let a = adjacency[i][0]
  //   let b = adjacency[i][1]
  //   console.log(a)
  //   console.log(b)
  //   let reg = `(379(?:${a}|${b}).*(\\r?\\n079.*?)*)(${b}\\s|${a}\\s)`
  //   console.log(reg)
  //   var regAdj = new RegExp(reg, "gm")
  //   while ((regAdj.exec(data) !== null)) {
  //     count++
  //     data = data.replace(regAdj, '$1');
  //   }
  // }

  return { data: data, count: count }
}

export const resData = async (records) => {
  let resistors = []
  for (var i = 0; i < records.length; i++) {
    if (records[i].op_code == '370') {
      let resistor = {
        key: records[i].name,
        name: records[i].name,
        net_start: records[i].net,
        net_end: records[i + 1].net,
        value: records[i].value,
        high: records[i].high,
        low: records[i].low,
      }
      resistors.push(resistor)
    }
  }
  return resistors
}

export const resCreate = async (records, resistors) => {
  let batch = `
C                                                                                                                                                                                                     
C                                                                                                                                                                                                     
C  RESISTOR RECORDS :                                                                                                                                                                                 
C                                                                                                                                                                                                     
C                                                                                                                                                                                                     \n`
  for (var i = 0; i < resistors.length; i++) {
    let start_coord = pointFromNet(records, resistors[i].net_start)
    let end_coord = pointFromNet(records, resistors[i].net_end)
    let firstrecord = `370${resistors[i].net_start.padEnd(15)}A${('0' + start_coord.side).slice(-2)} X${
      start_coord.x
    }Y${start_coord.y} R ${numberToIpcExp(resistors[i].value)} ${numberToIpcExp(resistors[i].low)} ${numberToIpcExp(
      resistors[i].high
    )} ${resistors[i].name}\n`
    let secondrecord = `070${resistors[i].net_end.padEnd(15)}A${('0' + end_coord.side).slice(-2)} X${end_coord.x}Y${
      end_coord.y
    } X+000000Y+000000 X0000Y0000 L00\n`
    // 370NET2           A01 X+009526Y+019222 R 4000E+0 4000E+0 4000E+0 R1
    // 070NET2           A01 X+011581Y+013935 X+002426Y+006652 X0000Y0000 L00
    batch += firstrecord + secondrecord
  }
  console.log(batch)
  return batch
}

export const resRewrite = async (data, batch) => {
  let result = data.split(/\r?\n/)
  let writeline = 0
  for (var i = 0; i < result.length; i++) {
    if (result[i] !== undefined) {
      if (result[i].startsWith('379') || result[i].startsWith('079')) {
        writeline = i + 1
      }
      if (result[i].startsWith('370') || result[i].startsWith('070')) {
        delete result[i]
      }
    }
  }
  var filtered = result.filter(function (x) {
    return x !== undefined
  })
  filtered.splice(writeline, 0, batch)
  console.log(writeline)
  return filtered.join('\n')
}

const numberToIpcExp = (number) => {
  number = Math.round(Number(number))
  if (number >= 10000) {
    let form = number.toExponential(3).toString().replace('.', '').toUpperCase()
    let exp = Number(form.slice(-1)) - 3
    let ipc = `${form.slice(0, -1)}${exp}`
    return ipc
  } else {
    return `${number.toString().padStart(4, '0')}E+0`
  }
}

const pointFromNet = (records, net) => {
  for (var i = 0; i < records.length; i++) {
    if (records[i].net == net && records[i].point !== undefined) {
      return {
        x: records[i].x_text,
        y: records[i].y_text,
        side: records[i].side,
      }
    }
  }
  return
}
