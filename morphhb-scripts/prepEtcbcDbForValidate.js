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
      
      const statement = `
        DROP TABLE IF EXISTS etcbc; 
        CREATE TABLE etcbc LIKE words;
        ALTER TABLE etcbc MODIFY COLUMN word VARCHAR(50);
        INSERT etcbc
          SELECT
            NULL as id,
            bk_num as bookId,
            ch_num as chapter,
            vs_num as verse,
            vs_word_num as number,
            heb_word as word,
            NULL as append,
            "" as lemma,
            morph_code as morph,
            "word" as wordtype,
            "none" as status
          FROM etcbc_words_combined;
      `

      connection.query(statement, (err, result) => {
        if(err) throw err

        console.log(`    - done.`)
        next()
      })
    
    },

    (x, next) => {
      
      console.log(`  Removing 6 etcbc qere word additions...`)

      const statement = `
        UPDATE etcbc SET word="את" WHERE bookId=13 AND chapter=38 AND verse=16 AND number=9;
        UPDATE etcbc SET word="אם" WHERE bookId=13 AND chapter=39 AND verse=12 AND number=9;
        UPDATE etcbc SET word="ידרך" WHERE bookId=13 AND chapter=51 AND verse=3 AND number=1;
        UPDATE etcbc SET word="חמשׁ" WHERE bookId=14 AND chapter=48 AND verse=16 AND number=10;
        UPDATE etcbc SET word="אם" WHERE bookId=31 AND chapter=3 AND verse=12 AND number=3;
        UPDATE etcbc SET word="בתיהם" WHERE bookId=39 AND chapter=34 AND verse=6 AND number=6;
      `

      connection.query(statement, (err, result) => {
        if(err) throw err

        console.log(`    - done.`)
        next()
      })
    
    },

    // split on space or dash, noting that there are more than one/verse sometimes
    // 

    (x, next) => {
      
      console.log(`  Splitting on space or dash...`)

      // const statement = `
      // `

      // connection.query(statement, (err, result) => {
      //   if(err) throw err

      //   console.log(`    - done.`)
      //   next()
      // })
      next()
    
    },

    (x, next) => {
      
      console.log(`  Adding blank rows where there is qere...`)

      // ETCBC has no qere
      // 2000 places where the words do not match up
      // ------Between OSHB and ETCBC, sometimes words (especially place names) are stored together in one row or separately in different rows. Eg, Gen 4:22; 14:7.
      next()

    },

    (x, next) => {
      
      console.log(`  Reindexing...`)

      // ETCBC has no qere
      // 2000 places where the words do not match up
      // ------Between OSHB and ETCBC, sometimes words (especially place names) are stored together in one row or separately in different rows. Eg, Gen 4:22; 14:7.
      next()

    },

    (x, next) => {
      
      console.log(`  Check for alignment...`)
      next()
      
    },

    (x, next) => {
      
      console.log(`  Correct morph of prepositions with definite article...`)

      // May need to modify code so that Prepositions followed by Definite Article only have Rd morph code, instead of RTd, since ETCBC stores definite article in its own row after the preposition row.
      next()

    },

    (x, next) => {
      
      console.log(`  Mark place of suffixes...`)

      // ETCBC does not parse suffixes, although they are (to some degree) stored in a separate column in the database. OSHB does parse them, so need to work with that.
      // Often when a word has a suffix, ETCBC parses it as absolute, whereas OSHB parses it as construct.
      next()

    },

    (x, next) => {
      
      console.log(`  Add in common gender where appropriate...`)

      // 1cs
      // 1cp
      // 3cp
      // In ETCBC, where 3rd common is an option in OSHB, the ETCBC will sometimes NOT use any gender. Eg. HC/Vqp3p instead of HC/Vqq3cp
      next()

    },

    () => {
      console.log(`\nCOMPLETED\n`)
      process.exit()
    }
    
  ])
})
