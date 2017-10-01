require('dotenv').config()

const mysql = require('mysql')

const fix = require('./scripts/fix')
const weedOut = require('./scripts/weed_out')
const flag = require('./scripts/flag')
const compare = require('./scripts/compare')
const autoParse = require('./scripts/auto_parse')
const check = require('./scripts/check')
const validate = require('./scripts/validate')
const utils = require('./utils')

const runInSeries = (funcs, connection) => {
  const runNext = () => {
    funcs.shift()(connection, runNext)
  }
  runNext()
}

const connection = mysql.createConnection({
  host: process.env.DB_NAME || "localhost",
  database: process.env.HOSTNAME || 'oshb-parsing',
  user: process.env.USERNAME || "root",
  password: process.env.PASSWORD || "",
  multipleStatements: true,
});

connection.connect(function(err) {
  if(err) throw err

  console.log(`\nSTARTING`)

  console.log(`\nCreating _enhanced tables...`)

  let createTableStatements = ``

  // create _enhanced tables as copies
  ;[
    'notes',
    'wordnote',
    'words'
  ].forEach(table => {
    createTableStatements += `
      DROP TABLE IF EXISTS ${table}_enhanced; 
      CREATE TABLE ${table}_enhanced LIKE ${table}; 
      INSERT ${table}_enhanced SELECT * FROM ${table};
    `
  })

  connection.query(createTableStatements, (err, result) => {
    if(err) throw err

    utils.createIndexes(connection, () => {

      console.log(`Done creating _enhanced tables.`)
  
      runInSeries([
        fix,
        weedOut,
        flag,
        compare,
        autoParse,
        check,
        validate,
        () => {
          console.log(`\nCOMPLETED\n`)
          process.exit()
        }
      ], connection)
      
    })

  })

});