require('dotenv').config()

const mysql = require('mysql')
var xml2js = require('xml2js')
fs = require('fs')

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

  utils.runInSeries([  

    (x, next) => {

      console.log(`\nStatus report by book: unverified (none/conflict/single/confirmed)\n`)

      const select = `
        SELECT
          bookId,
          status,
          COUNT(*) as cnt
        FROM
          words
        WHERE
          status NOT LIKE "verified"
        GROUP BY 
          bookId, status
        ORDER BY
          bookId, status
      `

      connection.query(select, (err, result) => {
        if(err) throw err

        const statusByBookId = {}

        result.forEach(row => {
          if(!statusByBookId[row.bookId]) {
            statusByBookId[row.bookId] = {}
          }
          if(!statusByBookId[row.bookId]['total']) {
            statusByBookId[row.bookId]['total'] = 0
          }
          statusByBookId[row.bookId]['total'] += parseInt(row.cnt)
          statusByBookId[row.bookId][row.status] = row.cnt
        })
        
        for(let bookId in statusByBookId) {
          const bookName = utils.getBibleBookName(bookId)
          const status = statusByBookId[bookId]
          console.log(`  ${bookName} ${" ".repeat(15 - bookName.length)} ${status['total']} (${status['none'] || 0}/${status['conflict'] || 0}/${status['single'] || 0}/${status['confirmed'] || 0})`)
        }
          
        next()
      })
  
    },

    () => {
      console.log(`\nCOMPLETED\n`)
      process.exit()
    }
    
  ])
})
