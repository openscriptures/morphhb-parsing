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

  utils.createEnhancedTables(connection, {
    tables: [
      'notes',
      'wordnote',
      'words'
    ],
  }, () => {

    utils.createIndexes(connection, {
      indexes: [
        {
          table: 'notes',
          col: 'morph',
        },
        {
          table: 'notes',
          col: 'noteDate',
        },
        {
          table: 'wordnote',
          col: 'wordId',
        },
        {
          table: 'wordnote',
          col: 'noteId',
        },
        {
          table: 'words',
          col: 'morph',
        },
        {
          table: 'words',
          col: 'word',
        },
        {
          table: 'words',
          col: 'lemma',
        },
        {
          table: 'words',
          col: 'status',
        },
      ],
    }, () => {

      utils.createAccentlessWordCol(connection, () => {

        console.log(`Done creating _enhanced tables.`)
    
        utils.runInSeries([
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
  })

});