
// Node/Election Api
const fs = window.require('fs');
const path = window.require('path');
const process = window.require('process');
const util = window.require('util');
const electron = window.require('electron').remote;
const dialog = electron.dialog;
const { execSync, exec, spawn, spawnSync } = window.require('child_process');

export default class ODB2GBR {
  constructor() {
    this.converterpath = process.env.ODB2GBR
    console.log('ODB2GBR is here: ', this.converterpath)
  }

  getGerberData = (job, dest) => {
    spawn
  }

  
}

// example cmdline execution
// ./odb2gbr_cmdlne64.exe -job:H:\test\jobs\jani -outdir:C:\etc\livegerber -workdir:C:\etc\workinggerber -step:pcb,top,bot,smt,smb,outline,sst,ssb -explode_all