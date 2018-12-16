require('dotenv').config()

process.exit()

const mysql = require('mysql')
const utils = require('./utils')

const connection = mysql.createConnection({
  host: process.env.DB_NAME || "localhost",
  database: process.env.HOSTNAME || 'oshb',
  user: process.env.USERNAME || "root",
  password: process.env.PASSWORD || "",
  multipleStatements: true,
});

connection.connect(function(err) {
  if(err) throw err

  console.log(`\nSTARTING`)

  const base58Characters = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'.split('')
  const ids = []

  base58Characters.forEach(char1 => {
    base58Characters.forEach(char2 => {
      base58Characters.forEach(char3 => {
        const insertIndex = Math.floor( Math.random() * ( ids.length + 1 ) )
        ids.splice( insertIndex, 0, `${char1}${char2}${char3}` )
      })
    })
  })

  const inserts = ids.map(id => {
    return `INSERT INTO uids SET uid='${id}'`
  })

  utils.doUpdatesInChunks(connection, { updates: inserts }, numRowsUpdated => {
    if(numRowsUpdated != inserts.length) throw new Error(`-----------> ERROR: Not everything got inserted. Just ${numRowsUpdated}/${inserts.length}.`)
    console.log(`\nDONE (successful)`)
    process.exit();
  })

})
