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

  
  const readyToRunCheck = `
    SELECT table_name FROM information_schema.tables
      WHERE table_schema='${process.env.HOSTNAME || 'oshb'}' AND table_name='words_enhanced'
  `

  connection.query(readyToRunCheck, (err, result) => {
    if(err) throw err

    if(result.length == 0) {
      console.log(`\nFIRST RUN THE SCRIPT TO BUILD OUT WORDS_ENHANCED: node run.js\n`)
      process.exit()
      return
    }

    copyTableStatement = `
      DROP TABLE IF EXISTS words_enhanced_copy; 
      CREATE TABLE words_enhanced_copy LIKE words_enhanced; 
      INSERT words_enhanced_copy SELECT * FROM words_enhanced;
    `
    connection.query(copyTableStatement, (err, result) => {
      if(err) throw err
      
      utils.deleteRowsMadeByScript({ connection, enhancedTables: false }, () => {

        // console.log(`\nCreating 'bad' column in notes table...`)
      
        // const addColStatement = `ALTER TABLE notes ADD COLUMN bad TINYINT(1) DEFAULT 0 AFTER verification`
      
        // connection.query(addColStatement, (err, result) => {
        //   // it is okay if it throws an error, as this mean the column already exists
        //   // if(err) throw err
        //   console.log(`    - done.`)

        //   console.log(`\nMarking notes rows 'bad' where appropriate...`)
          
        //   // mark bad:1 where a row's word in words_enhanced is status:none
        //   const selectBadNoteIds = `
        //     SELECT notes.id
        //     FROM notes
        //       LEFT JOIN wordnote ON (wordnote.noteId = notes.id)
        //       LEFT JOIN words_enhanced ON (wordnote.wordId = words_enhanced.id)
        //     WHERE 
        //       words_enhanced.status NOT IN ('none', 'single', 'confirmed', 'verified')
        //   `

        //   connection.query(selectBadNoteIds, (err, result) => {
        //     if(err) throw err

        //     const updates = [
        //       `UPDATE notes SET bad=0`,
        //       ...result.map(row => `
        //         UPDATE notes SET bad=1 WHERE id=${row.id}
        //       `)
        //     ]
        
        //     utils.doUpdatesInChunks(connection, { updates }, numRowsUpdated => {
        //       console.log(`    - ${result.length} notes rows marked bad.`)

              // add in notes and word_note table rows for every word in words_enhanced where the morph
              // code is not represented for that word in a notes table row (give these inserted rows memberId=416)

              const selectAllWords = `
                SELECT words_enhanced.id, words_enhanced.morph, words_enhanced.status, notes.morph as notesMorph
                FROM words_enhanced
                  LEFT JOIN wordnote ON (wordnote.wordId = words_enhanced.id)
                  LEFT JOIN notes ON (wordnote.noteId = notes.id)
                WHERE words_enhanced.morph IS NOT NULL
                ORDER BY words_enhanced.id
              `

              connection.query(selectAllWords, (err, result) => {
                if(err) throw err

                console.log(`\nCreating new notes rows where appropriate...`)

                let words = []

                result.forEach(word => {
                  if(words.length > 0 && word.id == words[words.length - 1].id) {
                    if(word.notesMorph) {
                      words[words.length - 1].notesMorph.push(word.notesMorph)
                    }
                  } else {
                    word.notesMorph = [ word.notesMorph ]
                    words.push(word)
                  }
                })

                words = words.filter(word => !word.notesMorph.includes(word.morph))

                const updates = words.map(word => `
                  INSERT INTO notes
                    (memberId, noteDate, morph, verification)
                    VALUES (416, '0000-01-01 00:00:00', '${word.morph}', ${word.status == 'verified' ? 1 : 0})
                `)

                const addlUpdates = []
                const resultCallback = (result, index) => {
                  addlUpdates.push(`INSERT INTO wordnote
                    (wordId, noteId)
                    VALUES (${words[index].id}, ${result.insertId})
                  `)
                }

                utils.doUpdatesInChunks(connection, { updates, resultCallback }, numRowsUpdated => {
                  console.log(`    - ${numRowsUpdated} notes rows created.`)

                  console.log(`\nCreating new wordnote rows where appropriate...`)

                  utils.doUpdatesInChunks(connection, { updates: addlUpdates }, numRowsUpdated => {
                    console.log(`    - ${numRowsUpdated} wordnote rows created.`)

                    console.log(`\nDrop indexes created for words_enhanced...`)

                    utils.dropIndexes(connection, {
                      indexes: [
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
                          col: 'bookId',
                        },
                        {
                          table: 'words',
                          col: 'chapter',
                        },
                        {
                          table: 'words',
                          col: 'verse',
                        },
                        {
                          table: 'words',
                          col: 'number',
                        },
                        {
                          table: 'words',
                          col: 'lemma',
                        },
                        {
                          table: 'words',
                          col: 'wordtype',
                        },
                        {
                          table: 'words',
                          col: 'status',
                        },
                      ],
                    }, () => {
                
                      console.log(`\nSwap words_enhanced in for words...`)
                      // drop accentlessword column in words_enhanced table
                      // rename words to words_[date]
                      // rename words_enhanced to words
                      const statementSet = `
                        ALTER TABLE words_enhanced DROP COLUMN accentlessword;
                        ALTER TABLE words_enhanced DROP COLUMN noguess;
                        RENAME TABLE words TO words_${new Date().toString().replace(/[ :+\(\)-]/g, '_')};
                        RENAME TABLE words_enhanced TO words;
                        RENAME TABLE words_enhanced_copy TO words_enhanced;
                      `

                      connection.query(statementSet, (err, result) => {
                        if(err) throw err
                                
                        console.log(`\nCOMPLETED\n`)
                        process.exit()
              
                      })            
                    })            
                  })            
                })            

              })            
        //     })
        //   })
        // })
      })
    })
  })
});