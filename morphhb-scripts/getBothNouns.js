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

  const bothNounsByLemma = {}

  const addInNouns = (rows, from) => {

    rows.forEach(row => {
      const lemma = row.id
      
      if(!bothNounsByLemma[lemma]) {
        bothNounsByLemma[lemma] = {}
      }
      row.word && (bothNounsByLemma[lemma].word = row.word)
      bothNounsByLemma[lemma][from] = true
    })
  }

  utils.runInSeries([
    
    (x, next) => {
      
      console.log(`  Create simpleLemma column in words table...`)
      
      const statements = `
        ALTER TABLE words ADD COLUMN simpleLemma VARCHAR(20);
        UPDATE words SET simpleLemma=lemma;
        CREATE INDEX lemma_index ON words (lemma);
      `

      connection.query(statements, (err, result) => {
        if(err) throw err
        
        const statement = `SELECT id, lemma FROM words WHERE lemma NOT REGEXP '^[0-9]+$'`

        connection.query(statement, (err, result) => {
          if(err) throw err

          const updates = result.map(row => {
            return `UPDATE words SET simpleLemma='${row.lemma.replace(/^.*\/([^\/]+)/, '$1').replace(/ /g, '')}' WHERE id=${row.id}`
          })

          utils.doUpdatesInChunks(connection, { updates }, numRowsUpdated => {
            if(numRowsUpdated != updates.length) throw new Error(`-----------> ERROR: Not everything got updated. Just ${numRowsUpdated}/${updates.length}.`)
            next()
          })
        })
      })

    },

    (x, next) => {
      
      console.log(`  Get from bdb...`)
      
      const statement = `
        SELECT id, word FROM bdb WHERE pos LIKE "n"      
      `

      connection.query(statement, (err, result) => {
        if(err) throw err

        addInNouns(result, 'bdb')
        next()
      })
    
    },

    (x, next) => {
      
      console.log(`  Get from words...`)
      
      const statement = `
        SELECT DISTINCT words.simpleLemma as id, bdb.word
        FROM words
          LEFT JOIN bdb ON (words.simpleLemma=bdb.id)
        WHERE morph REGEXP "^H([^\/]*\/)*N[^\/]b"
      `

      connection.query(statement, (err, result) => {
        if(err) throw err

        addInNouns(result, 'uhb')
        next()
      })
    
    },

    (x, next) => {
      
      console.log(`  Get from etcbc...`)
      
      const statement = `
        SELECT DISTINCT words.simpleLemma as id, bdb.word
        FROM etcbc_enhanced
          LEFT JOIN words ON (etcbc_enhanced.id=words.id)
          LEFT JOIN bdb ON (words.simpleLemma=bdb.id)
        WHERE
          etcbc_enhanced.morph REGEXP "^H([^\/]*\/)*N[^\/p]b"
          AND words.morph NOT REGEXP "^H([^\/]*\/)*Ac"
      `

      connection.query(statement, (err, result) => {
        if(err) throw err

        addInNouns(result, 'etcbc')
        next()
      })

    },

    (x, next) => {
      
      console.log(`  Drop simpleLemma column...`)
      
      const statements = `
        ALTER TABLE words DROP COLUMN simpleLemma;
        DROP INDEX lemma_index ON words;
      `

      connection.query(statements, (err, result) => {
        if(err) throw err

        next()
      })

    },

    (x, next) => {

      console.log(`  Output results...`)

      const output = {
        "'both' in all three": [],
        "'both' in bdb and uhb": [],
        "'both' in bdb and etcbc": [],
        "'both' in uhb and etcbc": [],
        "'both' in bdb only": [],
        "'both' in uhb only": [],
        "'both' in etcbc only": [],
      }

      for(let lemma in bothNounsByLemma) {
        if(bothNounsByLemma[lemma].bdb && bothNounsByLemma[lemma].uhb && bothNounsByLemma[lemma].etcbc) {
          output["'both' in all three"].push(`${bothNounsByLemma[lemma].word}  - H${lemma}`)
        } else if(bothNounsByLemma[lemma].bdb && bothNounsByLemma[lemma].uhb) {
          output["'both' in bdb and uhb"].push(`${bothNounsByLemma[lemma].word}  - H${lemma}`)
        } else if(bothNounsByLemma[lemma].bdb && bothNounsByLemma[lemma].etcbc) {
          output["'both' in bdb and etcbc"].push(`${bothNounsByLemma[lemma].word}  - H${lemma}`)
        } else if(bothNounsByLemma[lemma].uhb && bothNounsByLemma[lemma].etcbc) {
          output["'both' in uhb and etcbc"].push(`${bothNounsByLemma[lemma].word}  - H${lemma}`)
        } else if(bothNounsByLemma[lemma].bdb) {
          output["'both' in bdb only"].push(`${bothNounsByLemma[lemma].word}  - H${lemma}`)
        } else if(bothNounsByLemma[lemma].uhb) {
          output["'both' in uhb only"].push(`${bothNounsByLemma[lemma].word}  - H${lemma}`)
        } else if(bothNounsByLemma[lemma].etcbc) {
          output["'both' in etcbc only"].push(`${bothNounsByLemma[lemma].word}  - H${lemma}`)
        }
      }

      for(let key in output) {
        console.log(`    ${key}`)
        output[key].forEach(wordInfo => {
          console.log(`      ${wordInfo}`)
        })
      }

      next()
  
    },
    
    () => {
      console.log(`\nCOMPLETED\n`)
      process.exit()
    }
    
  ])
})
