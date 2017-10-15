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
      
      console.log(`  Make a copy of the etcbc_words_combined table with a schema that accords with words...`)
      
      const statement = `
        DROP TABLE IF EXISTS etcbc_enhanced; 
        CREATE TABLE etcbc_enhanced LIKE words;
        ALTER TABLE etcbc_enhanced MODIFY COLUMN word VARCHAR(50);
        INSERT etcbc_enhanced
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
      
      console.log(`  Removing etcbc_enhanced qere word additions...`)

      // UPDATE etcbc_enhanced SET word="את" WHERE bookId=13 AND chapter=38 AND verse=16 AND number=9;
      // UPDATE etcbc_enhanced SET word="אם" WHERE bookId=13 AND chapter=39 AND verse=12 AND number=9;
      // UPDATE etcbc_enhanced SET word="ידרך" WHERE bookId=13 AND chapter=51 AND verse=3 AND number=1;
      // UPDATE etcbc_enhanced SET word="חמשׁ" WHERE bookId=14 AND chapter=48 AND verse=16 AND number=10;
      // UPDATE etcbc_enhanced SET word="אם" WHERE bookId=31 AND chapter=3 AND verse=12 AND number=3;
      // UPDATE etcbc_enhanced SET word="בתיהם" WHERE bookId=39 AND chapter=34 AND verse=6 AND number=6;

      let statement = `
      `

      ;[
        [7,20,13,14],
        [9,8,3,12],
        [9,16,23,8],
        [9,18,20,18],
        [11,19,31,9],
        [11,19,37,8],
        [13,31,38,2],
        [13,50,29,12],
        [31,3,5,5],
        [31,3,17,8],
      ].forEach(qere => {
        statement += `
          DELETE FROM etcbc_enhanced WHERE bookId=${qere[0]} AND chapter=${qere[1]} AND verse=${qere[2]} AND number=${qere[3]};
          UPDATE etcbc_enhanced SET number=number-1 WHERE bookId=${qere[0]} AND chapter=${qere[1]} AND verse=${qere[2]} AND number>${qere[3]};
        `
      })

      connection.query(statement, (err, result) => {
        if(err) throw err

        console.log(`    - done.`)
        next()
      })
    
    },

    (x, next) => {
      
      console.log(`  Splitting on space or dash...`)

      const statement = `SELECT * FROM etcbc_enhanced WHERE word LIKE "% %" OR word LIKE "%־%"`

      connection.query(statement, (err, result) => {
        if(err) throw err

        const updates = []
        let offsetAdjustment = 0
        let priorLoc = ''

        result.forEach(row => {
          if(`${row.bookId}-${row.chapter}-${row.verse}` != priorLoc) {
            offsetAdjustment = 0
          }
          const wordParts = row.word.split(/[ ־]/g)
          updates.push(`UPDATE etcbc_enhanced SET number=number+${wordParts.length-1} WHERE bookId=${row.bookId} AND chapter=${row.chapter} AND verse=${row.verse} AND number>${row.number + offsetAdjustment}`)
          updates.push(`DELETE FROM etcbc_enhanced WHERE id=${row.id}`)
          wordParts.forEach(wordPart => {
            updates.push(`
              INSERT INTO etcbc_enhanced
                (bookId, chapter, verse, number, word, lemma, wordtype, status)
                VALUES ("${row.bookId}", "${row.chapter}", "${row.verse}", "${row.number + offsetAdjustment++}", "${wordPart}", "", "word", "none")
            `)
          })
          offsetAdjustment--
          priorLoc = `${row.bookId}-${row.chapter}-${row.verse}`
        })

        utils.doUpdatesInChunks(connection, { updates }, numRowsUpdated => {
          console.log(`    - done.`)
          next()                
        })
              
      })
    
    },

    (x, next) => {
      
      console.log(`  Adding blank rows where there is qere...`)

      const statement = `SELECT * FROM words WHERE wordtype='qere'`

      connection.query(statement, (err, result) => {
        if(err) throw err

        const updates = []

        result.forEach(row => {
          updates.push(`UPDATE etcbc_enhanced SET number=number+1 WHERE bookId=${row.bookId} AND chapter=${row.chapter} AND verse=${row.verse} AND number>=${row.number}`)
          updates.push(`
            INSERT INTO etcbc_enhanced
              (bookId, chapter, verse, number, lemma, wordtype, status)
              VALUES ("${row.bookId}", "${row.chapter}", "${row.verse}", "${row.number}", "", "qere", "none")
          `)
        })

        utils.doUpdatesInChunks(connection, { updates }, numRowsUpdated => {
          console.log(`    - done.`)
          next()                
        })
              
      })

    },

    (x, next) => {
      
      console.log(`  Divide words where they should have been divided...`)

      const updates = []
      ;[
        [4,7,59,16,"פְּדָה","צֽוּר","6301"],
      ].forEach(updateInfo => {
        updates.push(`UPDATE etcbc_enhanced SET number=number+1 WHERE bookId=${updateInfo[0]} AND chapter=${updateInfo[1]} AND verse=${updateInfo[2]} AND number>${updateInfo[3]}`)
        updates.push(`UPDATE etcbc_enhanced SET word="${updateInfo[4]}" WHERE bookId=${updateInfo[0]} AND chapter=${updateInfo[1]} AND verse=${updateInfo[2]} AND number=${updateInfo[3]}`)
        updates.push(`
          INSERT INTO etcbc_enhanced
            (bookId, chapter, verse, number, word, lemma, wordtype, status)
            VALUES ("${updateInfo[0]}", "${updateInfo[1]}", "${updateInfo[2]}", "${updateInfo[3]+1}", "${updateInfo[5]}", "${updateInfo[6]}", "word", "none")
        `)
      })
      
      utils.doUpdatesInChunks(connection, { updates }, numRowsUpdated => {
        console.log(`    - done.`)
        next()                
      })
              
    },

    // (x, next) => {
      
    //   console.log(`  Fix misc...`)

    //   const updates = []
    //   updates.push(`UPDATE etcbc_enhanced SET number=14 WHERE bookId=4 AND chapter=34 AND verse=4 AND number=15 AND word="חֲצַר"`)
      
    //   utils.doUpdatesInChunks(connection, { updates }, numRowsUpdated => {
    //     console.log(`    - done.`)
    //     next()                
    //   })
              
    // },

    (x, next) => {
      
      console.log(`  Combine words where they should be combined...`)

      const updates = []
      ;[
        [4,10,25,13,"עַמִּישַׁדָּֽי"],
        [1,14,17,8,"כְּדָרלָעֹ֔מֶר"],
      ].forEach(updateInfo => {
        updates.push(`UPDATE etcbc_enhanced SET word="${updateInfo[4]}" WHERE bookId=${updateInfo[0]} AND chapter=${updateInfo[1]} AND verse=${updateInfo[2]} AND number=${updateInfo[3]}`)
        updates.push(`DELETE FROM etcbc_enhanced WHERE bookId=${updateInfo[0]} AND chapter=${updateInfo[1]} AND verse=${updateInfo[2]} AND number=${updateInfo[3]+1}`)
        updates.push(`UPDATE etcbc_enhanced SET number=number-1 WHERE bookId=${updateInfo[0]} AND chapter=${updateInfo[1]} AND verse=${updateInfo[2]} AND number>${updateInfo[3]+1}`)
      })
      
      utils.doUpdatesInChunks(connection, { updates }, numRowsUpdated => {
        console.log(`    - done.`)
        next()                
      })
              
    },
    
    (x, next) => {
      
      console.log(`  Reindexing...`)

      const statement = `
        DROP TABLE IF EXISTS etcbc_temp; 
        CREATE TABLE etcbc_temp LIKE etcbc_enhanced;
        INSERT etcbc_temp
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
          FROM etcbc_enhanced
          ORDER BY bookId, chapter, verse, number;
        DROP TABLE IF EXISTS etcbc_enhanced; 
        RENAME TABLE etcbc_temp TO etcbc_enhanced;
      `

      connection.query(statement, (err, result) => {
        if(err) throw err

        console.log(`    - done.`)
        next()
      })

    },

    (x, next) => {
      
      console.log(`  Check for alignment...`)

      const limit = 1000
      let offset = 0
      let maxToShow = 200
      
      const more = () => {

        const statement = `
          SELECT
            words.*,
            etcbc_enhanced.bookId as eBookId,
            etcbc_enhanced.chapter as eChapter,
            etcbc_enhanced.verse as eVerse,
            etcbc_enhanced.number as eNumber,
            etcbc_enhanced.word as eWord
          FROM words
            LEFT JOIN etcbc_enhanced ON (words.id=etcbc_enhanced.id)
          LIMIT ${limit}
          OFFSET ${offset}
        `
  
        connection.query(statement, (err, result) => {
          if(err) throw err

          if(result.length == 0 || maxToShow <= 0) {
            console.log(`    - done.`)
            next()
            return 
          }
          
          result.some(row => {

            if(!row.eWord) return
            
            row.word = utils.makeVowelless(utils.makeAccentless(row.word.replace(/\//g, '')))
            row.eWord = utils.makeVowelless(utils.makeAccentless(row.eWord.replace(/\//g, '')))
  
            if(row.bookId != row.eBookId || row.chapter != row.eChapter || row.verse != row.eVerse || row.number != row.eNumber) {
              console.log(`    Word number or verse off: ${utils.getBibleBookName(row.bookId)} ${row.chapter}:${row.verse}[${row.number}] vs ${utils.getBibleBookName(row.eBookId)} ${row.eChapter}:${row.eVerse}[${row.eNumber}]`)
              maxToShow--
            } else if(row.word != row.eWord) {
              console.log(`    [${row.bookId},${row.chapter},${row.verse},${row.number},"","","${row.lemma}"] --Word discrepancy: ${row.word} vs ${row.eWord} in ${utils.getBibleBookName(row.bookId)} ${row.chapter}:${row.verse}[${row.number}]`)
              maxToShow--
            }
  
            return maxToShow <= 0
          })

          offset += limit
          more()
        })

      }

      more()
      
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
