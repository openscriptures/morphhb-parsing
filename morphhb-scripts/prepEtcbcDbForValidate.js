require('dotenv').config()

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

  utils.runInSeries([
    
    (x, next) => {
      
      console.log(`  Make a copy of the table with a schema that accords with words...`)
      
    },

    (x, next) => {
      
      console.log(`  Correct number column values where off...`)

      // ETCBC has no qere
      // 2000 places where the words do not match up
      // ------Between OSHB and ETCBC, sometimes words (especially place names) are stored together in one row or separately in different rows. Eg, Gen 4:22; 14:7.
      
    },

    (x, next) => {
      
      console.log(`  Correct morph of prepositions with definite article...`)

      // May need to modify code so that Prepositions followed by Definite Article only have Rd morph code, instead of RTd, since ETCBC stores definite article in its own row after the preposition row.
      
    },

    (x, next) => {
      
      console.log(`  Mark place of suffixes...`)

      // ETCBC does not parse suffixes, although they are (to some degree) stored in a separate column in the database. OSHB does parse them, so need to work with that.
      // Often when a word has a suffix, ETCBC parses it as absolute, whereas OSHB parses it as construct.
      
    },

    (x, next) => {
      
      console.log(`  Add in common gender where appropriate...`)

      // 1cs
      // 1cp
      // 3cp
      // In ETCBC, where 3rd common is an option in OSHB, the ETCBC will sometimes NOT use any gender. Eg. HC/Vqp3p instead of HC/Vqq3cp
      
    },

    () => {
      console.log(`\nCOMPLETED\n`)
      process.exit()
    }
    
  ])
})





