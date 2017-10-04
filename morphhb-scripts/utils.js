const utils = {

  runInSeries: (funcs, connection) => {
    const runNext = () => {
      funcs.shift()(connection, runNext)
    }
    runNext()
  },
  
  createEnhancedTables: (connection, { tables }, done) => {

    let createTableStatements = ``

    // create _enhanced tables as copies
    tables.forEach(table => {
      createTableStatements += `
        DROP TABLE IF EXISTS ${table}_enhanced; 
        CREATE TABLE ${table}_enhanced LIKE ${table}; 
        ALTER TABLE ${table}_enhanced CONVERT TO CHARACTER SET utf8 COLLATE utf8_bin;
        INSERT ${table}_enhanced SELECT * FROM ${table};
      `
    })

    connection.query(createTableStatements, (err, result) => {
      if(err) throw err

      done()
    })

  },

  createIndexes: (connection, { indexes }, done) => {

    let createIndexStatements = ``

    // create the indexes
    indexes.forEach(indexInfo => {
      createIndexStatements += `
        CREATE INDEX ${indexInfo.col}_index ON ${indexInfo.table}_enhanced (${indexInfo.col});
      `
    })

    connection.query(createIndexStatements, (err, result) => {
      if(err) throw err
      
      done()
    })

  },

  dropIndexes: (connection, { indexes }, done) => {

    let dropIndexStatements = ``

    indexes.forEach(indexInfo => {
      dropIndexStatements += `
        DROP INDEX ${indexInfo.col}_index ON ${indexInfo.table}_enhanced;
      `
    })

    connection.query(dropIndexStatements, (err, result) => {
      if(err) throw err
      
      done()
    })

  },

  addColumn: (connection, { table, col, colDef, afterCol }, done) => {

    const addColStatements = `ALTER TABLE ${table}_enhanced ADD COLUMN ${col} ${colDef} AFTER ${afterCol};`

    connection.query(addColStatements, (err, result) => {
      if(err) throw err
      
      done()
    })

  },

  doUpdatesInChunks: (connection, { updates }, done) => {
    updates = [...updates]
    let totalRowsUpdated = 0

    const doNextChunkOfUpdates = () => {

      if(updates.length > 0) {
        const updatesChunk = updates.splice(0, 100)

        connection.query(updatesChunk.join(';'), (err, result) => {
          if(err) throw err

          if(!(result instanceof Array)) result = [result]

          result.forEach(updateResult => {
            totalRowsUpdated += updateResult.affectedRows
          })

          doNextChunkOfUpdates()
          
        })

      } else {
        done(totalRowsUpdated)

      }
    }

    doNextChunkOfUpdates()

  },

  createAccentlessWordCol: (connection, done) => {

    utils.addColumn(connection, {
      table: 'words',
      col: 'accentlessword',
      colDef: 'VARCHAR(20)',
      afterCol: 'word',
    }, () => {

      const selectAllUniqueWords = `SELECT DISTINCT word FROM words_enhanced`
  
      connection.query(selectAllUniqueWords, (err, result) => {
        if(err) throw err

        let updatesWithAccentlessWord = []

        result.forEach(row => {
          const accentlessWord = row.word
            .replace(/[\u0591-\u05AF\u05A5\u05BD\u05BF\u05C5\u05C7]/g, '')  // remove accents
            .replace(/\u200D/g, '')  // remove mystery character
          updatesWithAccentlessWord.push(`UPDATE words_enhanced SET accentlessword="${accentlessWord}" WHERE word="${row.word}"`)
        })

        utils.doUpdatesInChunks(connection, { updates: updatesWithAccentlessWord }, numRowsUpdated => {
          
          utils.createIndexes(connection, {
            indexes: [
              {
                table: 'words',
                col: 'accentlessword',
              },
            ],
          }, () => {
              
            done()
  
          })
        })
      })
    })

  },

  runReplaceOnMorph: ({ connection, table, regex, replace, doVerified=false, next }) => {

    let select = `SELECT * FROM ${table}_enhanced WHERE morph REGEXP '${regex.toString().replace(/^\/|\/[a-z]*$/g, '').replace(/\(\?:/g, '(')}'`

    if(!doVerified) {
      if(table == 'notes') {
        select += ` AND verification=0`
      } else if(table == 'words') {
        select += ` AND status!='verified'`
      }
    }

    connection.query(select, (err, result) => {
      if(err) throw err

      const updates = result.map(row => `
        UPDATE ${table}_enhanced SET morph='${row.morph.replace(regex, replace)}' WHERE id=${row.id}
      `)

      utils.doUpdatesInChunks(connection, { updates }, numRowsUpdated => {
        if(numRowsUpdated != updates.length) throw new Error(`-----------> ERROR: Not everything got updated. Just ${numRowsUpdated}/${updates.length}.`)
        console.log(`    - ${numRowsUpdated} words updated.`)
        next()
      })

    })

  },

  removeNoteOnMatch: ({ connection, regex, next }) => {

    let select = `
      SELECT notes_enhanced.*, words_enhanced.word, words_enhanced.bookId, words_enhanced.chapter, words_enhanced.verse
      FROM notes_enhanced
        LEFT JOIN wordnote_enhanced ON (wordnote_enhanced.noteId = notes_enhanced.id)
        LEFT JOIN words_enhanced ON (wordnote_enhanced.wordId = words_enhanced.id)
      WHERE notes_enhanced.morph REGEXP '${regex.toString().replace(/^\/|\/[a-z]*$/g, '').replace(/\(\?:/g, '(')}'
    `

    connection.query(select, (err, result) => {
      if(err) throw err

      const updates = result.map(row => {
        const verified = row.verification ? '| WAS VERIFIED ' : ''
        console.log(`    ${row.word} | ${row.morph} ${verified}| ${utils.getBibleBookName(row.bookId)} ${row.chapter}:${row.verse}`)
        return `DELETE FROM notes_enhanced WHERE id=${row.id}`
      })

      utils.doUpdatesInChunks(connection, { updates }, numRowsUpdated => {
        if(numRowsUpdated != updates.length) throw new Error(`-----------> ERROR: Not everything got updated. Just ${numRowsUpdated}/${updates.length}.`)
        console.log(`    - ${numRowsUpdated} words updated.`)
        next()
      })

    })

  },

  getBibleBookName: (bookid) => {

    return [
      "",
      "Genesis",
      "Exodus",
      "Leviticus",
      "Numbers",
      "Deuteronomy",
      "Joshua",
      "Judges",
      "1 Samuel",
      "2 Samuel",
      "1 Kings",
      "2 Kings",
      "Isaiah",
      "Jeremiah",
      "Ezekiel",
      "Hosea",
      "Joel",
      "Amos",
      "Obadiah",
      "Jonah",
      "Micah",
      "Nahum",
      "Habakkuk",
      "Zephaniah",
      "Haggai",
      "Zechariah",
      "Malachi",
      "Psalms",
      "Proverbs",
      "Job",
      "Song of Songs",
      "Ruth",
      "Lamentations",
      "Ecclesiastes",
      "Esther",
      "Daniel",
      "Ezra",
      "Nehemiah",
      "1 Chronicles",
      "2 Chronicles"
    ][bookid]

  }


}
  
module.exports = utils
  