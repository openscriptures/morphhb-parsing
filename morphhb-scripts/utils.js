const utils = {

  changeCollation: (connection, { table, col, colDef, charset, collation }, done) => {

    const changeCollationStatement = `
      ALTER TABLE ${table}_enhanced MODIFY ${col} ${colDef} CHARACTER SET ${charset} COLLATE ${collation};
    `

    connection.query(changeCollationStatement, (err, result) => {
      if(err) throw err
      
      done()
    })

  },

  createEnhancedTables: (connection, { tables }, done) => {

    let createTableStatements = ``

    // create _enhanced tables as copies
    tables.forEach(table => {
      createTableStatements += `
        DROP TABLE IF EXISTS ${table}_enhanced; 
        CREATE TABLE ${table}_enhanced LIKE ${table}; 
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
  