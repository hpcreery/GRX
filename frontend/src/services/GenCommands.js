const fs = window.require('fs')
const path = window.require('path')
const process = window.require('process')
const util = window.require('util')
const electron = window.require('electron').remote
const dialog = electron.dialog
const { execSync, exec, spawn, spawnSync } = window.require('child_process')

export default class Genesis {
  constructor(props) {
    this.session = process.env.GENESIS_SESSION
    this.gentmp = path.normalize(process.env.GENESIS_TMP)
    this.tmpINFO = path.join(path.normalize(process.env.GENESIS_TMP), 'info-gen-matrix')
    this.gendir = process.env.DIR
    this.log = [] // Static Log //
    this.gatewayInstance()
    // this.staticGatewayListener()
    // this.testSpawnDir()
  }

  // CLASS CONTROLLERS
  // -----------------

  clearLog = () => {
    this.log = []
  }

  // PROCESS CONTROLLERS
  // -------------------

  testSpawnDir = () => {
    console.log(this.session)
    console.log(this.gentmp)
    console.log(this.gendir)
    const ls = spawn('ls')
    ls.stdout.on('data', (data) => {
      console.log(`stdout: ${data}`)
    })
    ls.stderr.on('data', (data) => {
      console.error(`stderr: ${data}`)
    })
    ls.on('close', (code) => {
      console.log(`child process exited with code ${code}`)
    })
  }

  gatewayInstance = () => {
    console.log('Opening Genesis Gateway as User: ' + this.session)
    this.gateway = spawn('.\\public\\rescources\\supermatrix\\gateway.exe', [this.session], {
      shell: true,
    })
    this.gateway.on('error', (err) => {
      console.error('Failed to start subprocess Gateway.exe for Genesis 2K')
    })
    this.gateway.on('close', (err) => {
      console.error('Subprocess Gateway.exe for Genesis 2K Closed')
    })
  }

  gatewayListener = () => {
    return new Promise((resolve, reject) => {
      this.gateway.stdout.once(
        'data',
        (code) => {
          return resolve(code)
        },
        { once: true }
      )
    })
  }

  staticGatewayListener = () => {
    this.gateway.stdout.on('data', (data) => {
      console.log('Intercom: ' + data)
      return
    })
    this.gateway.stderr.on('data', (data) => {
      console.log('ERR: ' + data)
      return
    })
    this.gateway.stdout.on('end', (code) => {
      console.log('Stream has ended: ' + code)
      return
    })
    this.gateway.on('close', (code) => {
      console.log('Close Code is: ' + code)
      return
    })
    this.gateway.on('exit', (code) => {
      console.log(`Exit Code is: ${code}`)
      return
    })

    return
  }

  gatewayClose = async () => {
    console.log('Killing Gateway')
    this.gateway.stdin.write('.')
    // this.gateway.stdin.pause() // other
    // process.kill(this.gateway.pid); // Does not work
    // await this.gateway.exit(0);  // I think does not work
    // spawn('taskkill', ['/pid', this.gateway.pid, '/f', '/t']) // brute force
    await this.gateway.kill('SIGKILL') // Works
    console.log(
      this.gateway.killed
        ? 'Gateway Killed Successfully'
        : 'Gateway Killed Unsuccessfully: Loose and Uncontrolled Gateway Process in Existance'
    )
  }

  // LOW-LEVEL COMMUNICATION FUNCTIONS
  // ---------------------------------

  retroCMD = (command) => {
    const tick = Date.now()
    const log = (v) => console.log(`${v} Elapsed: ${Date.now() - tick}ms`)
    this.gateway.stdin.write(command + '\n')
    return new Promise((resolve, reject) => {
      var gateway = spawn('.\\public\\gateway.exe', [this.session, `"` + command + `"`], {
        shell: true,
      })
      gateway.stdout.on('data', (data) => {
        log(data + '')
        if (data) return resolve(data)
      })
      gateway.stderr.on('data', (data) => {
        log(data + '')
        if (data) return reject(data)
      })
      gateway.on('exit', (code) => {
        log(`Exit Code is: ${code}`)
      })
    })
  }

  async CMD(command) {
    const tick = Date.now()
    const log = () => Date.now() - tick
    var returncode = this.gatewayListener()
    this.gateway.stdin.write(command + '\n')
    returncode = await (await returncode).toString()
    this.log.push({ command, returncode, time: tick, duration: log() })
    return returncode
  }

  async COM(command, args = '', callback) {
    try {
      var returncode = await this.CMD('COM ' + command + args)
      if ((await returncode) == 0) {
        return returncode
      } else {
        throw await returncode
      }
    } catch (err) {
      throw `Bad COM command >> ${command}${args} >> ${err}`
    }
  }

  async COMANS() {
    let returncode = await this.CMD('COMANS')
    return await returncode.trim()
  }

  // GENESIS EXECUTION COMMANDS
  // --------------------------

  async checkInOutJob(mode) {
    return await this.COM(`check_inout,mode=${mode},type=job,job=${this.Job}`)
  }

  async saveJob() {
    return await this.COM(`save_job,job=${this.Job},override=no`)
  }

  async closeJob() {
    let closedjob = this.Job
    this.Job = ''
    return await this.COM(`close_job,job=${closedjob}`)
  }

  async openJob(job) {
    this.Job = job
    return await this.COM(`open_job,job=${job}`)
  }

  async isJobCheckedOut(job) {
    await this.COM(`check_inout,mode=test,type=job,Job=${job}`)
    return (await this.COMANS()) == 'yes' ? true : false
  }

  setJob(Job) {
    this.Job = Job
  }

  // Setter for Job instance. Future development
  // set Job(job) {
  // }

  async setJobAttribute(attr, value) {
    return await this.COM(
      `set_attribute,type=job,job=${this.Job},name1=,name2=,name3=,attribute=${attr},value=${value},units=inch`
    )
  }

  async runScript(path) {}

  // GENESIS INFO COMMANDS
  // ---------------------

  async getINFO(args) {
    let file = `${this.tmpINFO}_${Date.now()}.txt`
    await this.COM(`info,args=${args},out_file=${file},write_mode=replace,units=inch`)
    return await this.readINFO(file)
  }

  async getMatrixInfo() {
    return await this.getINFO(`-t matrix -e ${this.Job}/matrix -m script`)
  }

  async getJobInfo() {
    return await this.getINFO(`-t job -e ${this.Job} -m script`)
  }

  async getLayerInfo(step, layer) {
    return await this.getINFO(`-t layer -e ${this.Job}/${step}/${layer} -m script`)
  }

  async getUserAttributes() {
    let path = 'g:\\fw\\lib\\misc\\userattr'
    return await this.readDataType(path)
  }

  async getOpenJobs() {
    let file = `${this.tmpINFO}_${Date.now()}.txt`
    await this.COM(`list_open_jobs,file=${file}`)
    return this.readOpenJobs(file, this.session)
  }

  async getAllOpenJobs() {
    let file = `${this.tmpINFO}_${Date.now()}.txt`
    await this.COM(`list_open_jobs,file=${file}`)
    return this.readOpenJobs(file, false)
  }

  async setLayerType(layer, type) {
    if (type) {
      return await this.COM(`matrix_layer_type,job=${this.Job},matrix=matrix,layer=${layer},type=${type}`)
    } else {
      return null
    }
  }

  async setLayerContext(layer, context) {
    if (context) {
      return await this.COM(`matrix_layer_context,job=${this.Job},matrix=matrix,layer=${layer},context=${context}`)
    } else {
      return null
    }
  }

  async setLayerAttr(step, layer, attr, value) {
    return await this.COM(
      `set_attribute,type=layer,job=${this.Job},name1=${step},name2=${layer},name3=,attribute=${attr},value=${value},units=inch`
    )
  }

  // GENESIS INFO COMMAND HELPERS
  // Each Info command writes to temp file that needs to be read and converted
  // Different Methods of parsing data are used for each info command based on Entity Type and Data Type
  // Helper converters are added into the returned objects
  // ----------------------------------------------------------------------------------------------------

  readDataType(file) {
    return new Promise((resolve, reject) => {
      fs.readFile(file, 'utf8', (err, data) => {
        if (err) {
          reject(err)
        } else {
          var dataobj = this.parseDataType(data)
          console.log(dataobj)
          resolve(dataobj)
        }
      })
    })
  }

  parseDataType(data) {
    let linelist = data.split(/\r?\n/)
    let newlinelist = []
    let currentobj = {}
    let currenttype = ''
    for (var i = 0; i < linelist.length; i++) {
      if (linelist[i].trim().startsWith('#')) {
      } else if (linelist[i].trim() == '') {
      } else if (linelist[i].trim().startsWith('FORCE_LIB')) {
      } else if (linelist[i].trim().match(/(\w+)=(.+)/) !== null) {
        let parse = linelist[i].trim().match(/(\w+)=(.+)/)
        currentobj = { ...currentobj, [parse[1]]: parse[2] }
      } else if (linelist[i].match(/(\w+)\s{/) !== null) {
        if (currentobj !== {} && currenttype !== '') {
          newlinelist.push({ ...currentobj, TYPE: currenttype })
        }
        currenttype = linelist[i].match(/(\w+)\s{/)[1]
        currentobj = {}
      } else {
      }
    }
    return newlinelist
  }

  readOpenJobs(file, user) {
    return new Promise((resolve, reject) => {
      fs.readFile(file, 'utf8', (err, data) => {
        if (err) {
          try {
            fs.unlinkSync(file)
          } catch (err) {
            console.error('Cannot Delete Unknown Temp File: ', file)
          }
          reject(err)
        } else {
          var dataobj = this.parseOpenJobs(data, user)
          fs.unlinkSync(file)
          resolve(dataobj)
        }
      })
    })
  }

  parseOpenJobs(data, user) {
    var lines = data.split('\n')
    let open = []
    for (var i = 0; i < lines.length; i++) {
      if (lines[i] == '') continue
      var segments = lines[i].split(' ')
      let job = segments[0]
      let users = segments[1]
      if (user) {
        if (users == user) {
          open.push(job)
        }
      } else {
        open.push(job)
      }
    }
    return open
  }

  readINFO(file) {
    return new Promise((resolve, reject) => {
      fs.readFile(file, 'utf8', (err, data) => {
        if (err) {
          try {
            fs.unlinkSync(file)
          } catch (err) {
            console.error('Cannot Delete Temp File: ', err)
          }
          reject(err)
        } else {
          var dataobj = this.parseINFO(data)
          fs.unlinkSync(file)
          resolve(dataobj)
        }
      })
    })
  }

  parseINFO(data) {
    var lines = data.split('\n')
    var newdata = {}
    var set = /set\sg([^a-z\s]+)([^A-Z\s]+)?\s*/
    for (var i = 0; i < lines.length; i++) {
      if (lines[i] == '') continue
      var segments = lines[i].split('=')
      var definition = segments[0].match(set)
      var dataType = definition[1]
      var parameters = definition[2] ? definition[2] : undefined
      var prevalues = segments[1].trim()
      let values
      if (prevalues.startsWith('(')) {
        values = prevalues.split(/\s*\'\s*\'?\s*/).slice(1, -1)
      } else {
        values = prevalues.slice(1, -1)
      }

      if (parameters) {
        if (dataType in newdata) {
          newdata[dataType][parameters] = values
        } else {
          newdata[dataType] = { [parameters]: values }
        }

        // TRANSPOSE Helper: returns data similar to showing it as 'display' in genesis. Conforms the parameter data to a little more JS readable array of objects.
        newdata[dataType]['_transpose'] = function () {
          let transposed = []
          for (const property in this) {
            for (var k = 0; k < this[property].length; k++) {
              transposed[k] = { ...transposed[k], [property]: this[property][k] }
            }
          }
          return transposed
        }

        // REDUCE Helper: combines indexed values (key, value arguments) of same Data Type but different parameters into individual key:object pairs. Easy to read in JS.
        newdata[dataType]['_reduce'] = function (key, value) {
          let reduced = {}
          if (key in this && value in this) {
            for (var k = 0; k < this[key].length; k++) {
              let item = this[key][k]
              reduced = { ...reduced, [item]: this[value][k] }
            }
          }
          return reduced
        }
      } else {
        newdata[dataType] = values
      }
    }
    return newdata
  }
}
