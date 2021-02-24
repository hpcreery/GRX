// // REACT COMPONENTS
// import React from 'react'

// // ANTD COMPONETNS
// import { message } from 'antd'
// import { LoadingOutlined, VideoCameraOutlined } from '@ant-design/icons'

// // BACKEND
// const { backendurl } = require('../../config/config')

// async function FetchArtwork(urlext, render) {
//   try {
//     let response = await fetch(backendurl + urlext)
//     if (response.status !== 200) {
//       console.error(response)
//       var err = 'Status: ' + response.status + ' Message: ' + (await response.text())
//       throw err
//     }
//     let data = await response.json()
//     return render()
//   } catch (err) {
//     message.error('Server Error => ' + err)
//     throw err
//   }
// }

// export default FetchArtwork
