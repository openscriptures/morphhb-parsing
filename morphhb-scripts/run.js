require('dotenv').config()

const mysql = require('mysql')

const fix = require('./scripts/fix')
const weedOut = require('./scripts/weed_out')
const flag = require('./scripts/flag')
const compare = require('./scripts/compare')
const guessParse = require('./scripts/guess_parse')
const autoParse = require('./scripts/auto_parse')
const check = require('./scripts/check')
const validate = require('./scripts/validate')
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

        utils.deleteRowsMadeByScript({ connection }, () => {
      
          utils.runInSeries([
            fix,
            weedOut,
            check,
            compare,
            autoParse,
            guessParse,
            validate,
            flag,
            () => {

              const statuses = [ 'none', 'conflict', 'single', 'confirmed', 'verified', 'error' ]

              const countStatuses = statuses.map(status => `
                SELECT COUNT(*) as cnt FROM words_enhanced WHERE status='${status}'
              `).join(';')

              connection.query(countStatuses, (err, results) => {
                if(err) throw err

                let total = 0
                results.forEach(result => total += result[0].cnt)

                console.log(`\nEND RESULT:`)
                let totalWithAtLeastSinglePass = 0
                results.forEach((result, index) => {
                  console.log(`  ${statuses[index]}: ${result[0].cnt} (${parseInt((result[0].cnt/total)*100)}%)`)
                  if([ 'single', 'confirmed', 'verified' ].includes(statuses[index])) {
                    totalWithAtLeastSinglePass += result[0].cnt
                  }
                })
                console.log(`  single/confirmed/verified: ${totalWithAtLeastSinglePass} (${parseInt((totalWithAtLeastSinglePass/total)*100)}%)`)
                
                console.log(`\nCOMPLETED\n`)
                process.exit()

              })
            }
          ], connection)
      
        })
      })
    })
  })

});