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
      
      console.log(`  Widen word column in words table...`)
      
      const statement = `
        ALTER TABLE words MODIFY COLUMN word VARCHAR(25);
      `

      connection.query(statement, (err, result) => {
        if(err) throw err

        console.log(`    - done.`)
        next()
      })
    
    },

    (x, next) => {
      
      console.log(`  Fix words where they were cut-off or incorrect...`)

      const statement = `
        UPDATE word SET word="אֶחָֽד", append="׃" WHERE bookId=5 AND chapter=6 AND verse=4 AND number=5;
      `

      connection.query(statement, (err, result) => {
        if(err) throw err

        console.log(`    - done.`)
        next()
      })
    
    },

    (x, next) => {
      
      console.log(`  Divide words where they should have been divided...`)

      const updates = []
      ;[
        [1,14,17,8,"כְּדָר","לָעֹ֔מֶר","3540"],
      ].forEach(updateInfo => {
        updates.push(`UPDATE words SET number=number+1 WHERE bookId=${updateInfo[0]} AND chapter=${updateInfo[1]} AND verse=${updateInfo[2]} AND number>${updateInfo[3]}`)
        updates.push(`UPDATE words SET word="${updateInfo[4]}" WHERE bookId=${updateInfo[0]} AND chapter=${updateInfo[1]} AND verse=${updateInfo[2]} AND number=${updateInfo[3]}`)
        updates.push(`
          INSERT INTO words
            (bookId, chapter, verse, number, word, lemma, wordtype, status)
            VALUES ("${updateInfo[0]}", "${updateInfo[1]}", "${updateInfo[2]}", "${updateInfo[3]+1}", "${updateInfo[5]}", "${updateInfo[6]}", "word", "none")
        `)
      })
      
      utils.doUpdatesInChunks(connection, { updates }, numRowsUpdated => {
        console.log(`    - done.`)
        next()                
      })
              
    },

    (x, next) => {
      
      console.log(`  Reindexing...`)

      const statement = `
        DROP TABLE IF EXISTS words_temp; 
        CREATE TABLE words_temp LIKE words;
        INSERT words_temp
          SELECT
            NULL as id,
            bookId,
            chapter,
            verse,
            number,
            word,
            append,
            lemma,
            morph,
            wordtype,
            status
          FROM words
          ORDER BY bookId, chapter, verse, number;
        DROP TABLE IF EXISTS words; 
        RENAME TABLE words_temp TO words;
      `

      connection.query(statement, (err, result) => {
        if(err) throw err

        console.log(`    - done.`)
        next()
      })

    },

    () => {
      console.log(`\n !!! Need to have this update the wordnote table as well!!`)
      console.log(`\nCOMPLETED\n`)
      process.exit()
    }
    
  ])
})
