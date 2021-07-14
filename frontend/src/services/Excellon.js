import config from '../config/config'

// Excellon.js
// Basic Functions for Reading and Controlling GCode

// Header Parameters:
// T# tool number
// C# tool diameter
// I# kind of tool
// O# diameter of the currter radius compensation
// P# routing feed rate
// Q# cutter wear (routing)
// V# dwell (PRGM,-D)
// B# retract feedrate of the Z-axis
// F# feed rate of the Z-axis
// S# spindle speed
// H# tool life
// Z# z-offset

// ([TCIOPQVFSHZB][+-]?[\d+.]+)(.*)

// ## Seib and Meyer
// Ref "File Format Production" for seib and meyer tool paramter configuration
// Ref "Interpreter Excellon.pdf" for seib and mayer header interpretation

// Groups: 1: Tool number with T leader 2: Tool number
const toolEx = /(T(\d\d))/
// Groups: 1: Tool number 2: +/- Diameter 3: Parameters
const prgmTool = /(T\d\d)C([+-]?\.\d+)(.*)/
// Groups: 1: Diameter 2: Parameters
const dbTool = /d.(\d+)\s(.*)/
// Groups: 1: Parameter Character 2: Parameter Value 3: Rest of the header [ This matches only the first paramter ]
const hdrParams = /([dTCIOPQVFSHZB])([+-]?[\d+.]*)(.*)/
// Carriage Return and Line Feed array combiner
const crlf = `\r\n`

// Soon to deprecitate
const toolParams = (string) => {
  if (string) {
    let chars = string.split('')
    let params = []
    let param = ''
    for (let char of chars) {
      if (isNaN(char) && char != '-' && char != '.' && param) {
        params.push(param)
        param = ''
      }
      if (char == ' ') {
        continue
      }
      param = param.concat(char)
    }
    params.push(param)
    return params
  }
  return
}

export default class Excellon {
  constructor(machine, code) {
    this.input = code
    this.machine = machine
    this.sections = this.splitData(code)
  }

  // Basic and reuseable methods
  output = () => {
    return this.joinData(this.sections)
  }

  splitData = (data) => {
    let sections = data.split(/\r?\n/)
    return sections
  }

  joinData = (data) => {
    return data.join(crlf)
  }

  fetchHeader = async (material, tool) => {
    try {
      let response = await fetch(config.api + ':' + config.port + `/${this.machine}/headers/${material}`, {
        method: 'GET',
      })
      if (response.status !== 200) {
        //var err = 'Status: ' + response.status + ' => Message: ' + (await response.text()) // ADVANCED
        var err = await response.text()
        throw err
      }
      let headers = await response.text()
      let divHeaders = headers.split(/\r?\n/)
      console.log(divHeaders)
      let header = divHeaders.find((header) => header.startsWith(`d${tool}`))
      console.log(header)
      return header
    } catch (err) {
      console.error(err)
      throw err
    }
  }

  updateHeaders = async (material) => {
    let newdata = []
    let header = false
    const paramReg = /(T\d\d)(C-?(\.\d+))(.*)/ // [full match, tool number, C entry, tool size, old params]
    const newparamReg = /d.(\d+)\s(.*)/ // [full match, tool size, new params]
    for (let line of this.sections) {
      if (line == 'M48') {
        header = true
      } else if (line == '%' || line == 'M95') {
        header = false
      }

      if (header && line.match(toolEx) !== null) {
        let toolListing = line.match(paramReg)
        let toolSize = toolListing[3]
        let toolNumber = toolListing[1]
        let toolSizeParameter = toolListing[2]
        let newHeader = await this.fetchHeader(material, toolSize)
        let newParams = newHeader.match(newparamReg)[2]
        console.log(toolNumber, toolSizeParameter, newParams)
        newdata.push(`${toolNumber}${toolSizeParameter}${newParams}`)
      } else {
        newdata.push(line)
      }
    }
    this.sections = newdata
  }

  // Specific methods
  addCustomToolingCode = (tooling, m83begin, m83finish) => {
    let newdata = []
    let header = false
    for (let line of this.sections) {
      if (line == 'M48') {
        header = true
      } else if (line == '%' || line == 'M95') {
        header = false
      }

      if (header && line.match(toolEx) !== null) {
        let params = toolParams(line)
        let modparams = params.map((param) => {
          if (param.startsWith('C')) {
            return `C${tooling}`
          } else {
            return param
          }
        })
        newdata.push(modparams.join(''))
      } else if (line == 'T01') {
        newdata.push(line)
        newdata.push(m83begin)
      } else if (line == 'M30') {
        newdata.push(m83finish)
        newdata.push(line)
      } else if (line.startsWith('M83')) {
        //console.log(line)
      } else {
        newdata.push(line)
      }
    }
    this.sections = newdata
  }

  keepSpindleLoaded = () => {
    let newdata = []
    let header = false
    for (let line of this.sections) {
      if (line == 'M48') {
        header = true
      } else if (line == '%' || line == 'M95') {
        header = false
      }

      if (!header && line == 'T00') {
      } else {
        newdata.push(line)
      }
    }
    this.sections = newdata
  }
}

/**
 * @constant HeaderConsts : Seib and Meyer Header Interpretation Structure
 * Reverse Engineered From Lenz and TongTai Machines
 */
export const HeaderConsts = {
  T: {
    units: '',
    multiplyer: 1,
    decade: false,
    title: 'Tool Number',
    description: 'T: Tool Number',
    color: '#ffffff',
  },
  C: {
    // DONE
    units: 'mils',
    multiplyer: 1,
    decade: false,
    title: 'Tool Diameter',
    description: 'C: Tool Diameter [mils]',
    color: '#ffffff',
  },
  d: {
    // DONE
    units: 'inch',
    multiplyer: 1,
    decade: false,
    title: 'Tool Diameter (NETVIA Headers)',
    description: 'd: Tool Diameter (NETVIA Headers) [inch]',
    color: '#ffffff',
  },
  B: {
    // DONE
    units: 'in/min',
    multiplyer: 0.1,
    decade: 4,
    title: 'Retract Rate',
    description: 'B: Retract Rate of Z-axis [in/min]',
    color: '#D8F3DC',
  },
  F: {
    // DONE
    units: 'in/min',
    multiplyer: 0.1,
    decade: 4,
    title: 'Feed Rate',
    description: 'F: Feed Rate of Z-axis [in/min]',
    color: '#B7E4C7',
  },
  H: {
    // DONE
    units: 'hits/inch',
    multiplyer: 1,
    decade: false,
    title: 'Tool Life',
    description: 'H: Tool Life [Drill: hits / Rout: inch]',
    color: '#95D5B2',
  },
  I: {
    //
    units: 'none',
    multiplyer: 1,
    decade: false,
    title: 'Kind of Tool',
    description: 'I: Kind of Tool',
    color: '#ffffff',
  },
  O: {
    units: 'inch',
    multiplyer: 1,
    decade: false,
    title: 'Cutter Compensation',
    description: 'O: Diameter for Cutter Radius Compensation [inch]',
    color: '#74C69D',
  },
  P: {
    // DONE
    units: 'in/min',
    multiplyer: 1 / 25.4, // in/min to mm/min
    decade: 4,
    title: 'Routing Feed Rate',
    description: 'P: Routing Feed Rate [in/min]',
    color: '#52B788',
  },
  Q: {
    // DONE
    units: 'mil/foot',
    multiplyer: 0.0001,
    decade: false,
    title: 'Routing Cutter Wear',
    description: 'Q: Routing Cutter Wear [mil/foot]',
    color: '#40916C',
  },
  S: {
    // DONE
    units: 'krpm',
    multiplyer: 0.1,
    decade: 3, // 3 DIGIT NUMBER but OK if 4 ??
    title: 'Spindle Speed',
    description: 'S: Spindle Speed [krpm]',
    color: '#2D6A4F',
  },
  V: {
    // DONE
    units: 'ms',
    multiplyer: 1,
    decade: false,
    title: 'Dwell',
    description: 'V: Dwell [ms]',
    color: '#1B4332',
  },
  Z: {
    // DONE
    units: 'inch',
    multiplyer: 0.0001,
    decade: 4,
    title: 'Z-offset',
    description: 'Z: Z-Offset [inch]',
    color: '#081C15',
  },
}

/**
 * @description Translate Header Strings to Code readable and mutable objects
 * @param {string} line : Single Line String from Netvia Drill/Route Headers ex "d.02F20S300..."
 * @returns {object} : Object Structured parameters in reference to HeaderConsts
 */
export const extractToolParameters = (line) => {
  let params = []
  let match
  const findNext = (string) => {
    if ((match = string.match(hdrParams))) {
      let decade = HeaderConsts[match[1]].decade
      let multiplyer = HeaderConsts[match[1]].multiplyer
      params.push({
        parameter: match[1],
        value: /^-?[0-9]+$/.test(match[2])
          ? decade
            ? Number(match[2].padEnd(decade, '0')) * multiplyer
            : Number(match[2])
          : Number(match[2]),
        ...HeaderConsts[match[1]],
      })
      findNext(match[3])
    } else {
      return
    }
  }
  findNext(line)
  // console.log(params)
  return params
}

/**
 * @description Translate Header objects back into Strings readable to Netvia Header pullers
 * @param {object} header : Header parameters ex {d: .012, F: 200, ...}
 * @returns {string} : String to Write back into Header File or Production Program
 */
export const insertToolParameters = (header) => {
  let str = ''
  for (var property in header) {
    let value = header[property]
    if (value == null) {
      continue
    }
    if (property == 'd') {
      let val = `${value}`.replace(/0+(?=\.)/, '').padEnd(5, '0')
      str += `${property}${val} `
    } else {
      console.log(property)
      let decade = HeaderConsts[property].decade
      let multiplyer = HeaderConsts[property].multiplyer
      str += `${property}${
        value == 0
          ? `0`
          : /^-?[0-9]+$/.test(value)
          ? decade
            ? `${value / multiplyer}`.padStart(decade, '0')
            : `${value}`
          : `${value}`
      }`
    }
  }
  // console.log(str)
  return str
}
