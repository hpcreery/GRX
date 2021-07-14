// const Connection = require('tedious').Connection
// const Request = require('tedious').Request
// const TYPES = require('tedious').TYPES

// export default class SQLConnection {
//   constructor(props) {
//     let config = {
//       server: 'sql.netvia.local',
//       authentication: {
//         type: 'default',
//         options: {
//           userName: 'NETVIA\\huntercrery', // HARD CODED LIKE A BADASS
//           password: 'NearBeer1!', // Close your eyes :)
//         },
//       },
//       options: {
//         encrypt: false,
//         database: 'nvg', //update me
//       },
//     }
//     this.connection = new Connection(config)
//     this.listenToConnection()
//     this.connection.connect()
//   }

//   listenToConnection = (dbcon) => {
//     dbcon.on('connect', function (err) {
//       console.log('Connected to SQL DB')
//     })
//   }

//   executeStatement = (statement) => {
//     request = new Request(
//       'SELECT c.CustomerID, c.CompanyName,COUNT(soh.SalesOrderID) AS OrderCount FROM SalesLT.Customer AS c LEFT OUTER JOIN SalesLT.SalesOrderHeader AS soh ON c.CustomerID = soh.CustomerID GROUP BY c.CustomerID, c.CompanyName ORDER BY OrderCount DESC;',
//       (err) => {
//         if (err) {
//           console.log(err)
//         }
//       }
//     )
//     var result = ''
//     request.on('row', (columns) => {
//       columns.forEach((column) => {
//         if (column.value === null) {
//           console.log('NULL')
//         } else {
//           result += column.value + ' '
//         }
//       })
//       console.log(result)
//       result = ''
//     })

//     request.on('done', (rowCount, more) => {
//       console.log(rowCount + ' rows returned')
//     })
//     connection.execSql(request)
//   }
// }

// // Simply
// const sql = require('mssql')
// const sqlConfig = {
//   user: process.env.DB_USER,
//   password: process.env.DB_PWD,
//   database: process.env.DB_NAME,
//   server: 'localhost',
//   pool: {
//     max: 10,
//     min: 0,
//     idleTimeoutMillis: 30000,
//   },
//   options: {
//     encrypt: true, // for azure
//     trustServerCertificate: false, // change to true for local dev / self-signed certs
//   },
// }

// ;async () => {
//   try {
//     // make sure that any items are correctly URL encoded in the connection string
//     await sql.connect(sqlConfig)
//     const result = await sql.query`select * from mytable where id = ${value}`
//     console.dir(result)
//   } catch (err) {
//     // ... error checks
//   }
// }
