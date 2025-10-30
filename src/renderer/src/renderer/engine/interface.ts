import * as Comlink from 'comlink'
import { DataInterface } from '../data/interface'


// export const  DataInterfaceProxy = Comlink.proxy(DataInterface)
export default DataInterface
Comlink.expose(DataInterface)
