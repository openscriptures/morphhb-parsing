const { suffixParsingMap, autoParseAndValidateMap, bothGenderLemmas } = require('./mappings')

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

  doUpdatesInChunks: (connection, { updates, resultCallback }, done) => {
    updates = [...updates]
    let totalRowsUpdated = 0
    let index = 0

    const doNextChunkOfUpdates = () => {

      if(updates.length > 0) {
        const updatesChunk = updates.splice(0, 100)

        connection.query(updatesChunk.join(';'), (err, result) => {
          if(err) throw err

          if(!(result instanceof Array)) result = [result]

          result.forEach(updateResult => {
            totalRowsUpdated += updateResult.affectedRows
            if(resultCallback) resultCallback(updateResult, index++)
          })

          doNextChunkOfUpdates()
          
        })

      } else {
        done(totalRowsUpdated)

      }
    }

    doNextChunkOfUpdates()

  },

  createAccentlessWordCol: ({ connection, table }, done) => {

    utils.addColumn(connection, {
      table,
      col: 'accentlessword',
      colDef: 'VARCHAR(30)',
      afterCol: 'word',
    }, () => {

      const selectAllUniqueWords = `SELECT DISTINCT word FROM ${table}_enhanced`
  
      connection.query(selectAllUniqueWords, (err, result) => {
        if(err) throw err

        let updatesWithAccentlessWord = []

        result.forEach(row => {
          if(row.word) {
            const accentlessWord = utils.makeAccentless(row.word)
            updatesWithAccentlessWord.push(`UPDATE ${table}_enhanced SET accentlessword="${accentlessWord}" WHERE word="${row.word}"`)
          }
        })

        utils.doUpdatesInChunks(connection, { updates: updatesWithAccentlessWord }, numRowsUpdated => {
          
          utils.createIndexes(connection, {
            indexes: [
              {
                table,
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

  createNoGuessCol: (connection, done) => {

    utils.addColumn(connection, {
      table: 'words',
      col: 'noguess',
      colDef: 'TINYINT(1)',
      afterCol: 'status',
    }, () => {

      utils.createIndexes(connection, {
        indexes: [
          {
            table: 'words',
            col: 'noguess',
          },
        ],
      }, () => {
        
        done()

      })
    })

  },

  makeAccentless: (word) => (
    word
      .replace(/[\u0591-\u05AF\u05A5\u05BD\u05BF\u05C5\u05C7]/g, '')  // remove accents
      .replace(/\u200D/g, '')  // remove mystery character
  ),

  makeVowelless: (word) => (
    word
      .replace(/[\u05B0-\u05BC\u05C1\u05C2\u05C4]/g, '')  // remove vowels
      .replace(/[שׁשׂ]/g, 'ש')  // make shin/sin ambiguous
  ),

  runReplaceOnMorph: ({ connection, table, regex, replace, doVerified=false, extraCondition=false, col='morph', quiet=false, next }) => {

    let select = `SELECT * FROM ${table}_enhanced WHERE ${col} REGEXP '${regex.toString().replace(/^\/|\/[a-z]*$/g, '').replace(/\(\?:/g, '(')}'`

    if(!doVerified) {
      if(table == 'notes') {
        select += ` AND verification=0`
      } else if(table == 'words') {
        select += ` AND status!='verified'`
      }
    }

    if(extraCondition) {
      select += ` AND (${extraCondition})`
    }

    const updatesByMorph = {}

    connection.query(select, (err, result) => {
      if(err) throw err

      const updates = result.map(row => {
        updatesByMorph[row[col]] = row[col].replace(regex, replace)
        return `UPDATE ${table}_enhanced SET ${col}='${row[col].replace(regex, replace)}' WHERE id=${row.id}`
      })

      if(!quiet) {
        for(let i in updatesByMorph) {
          console.log(`    ${i} > ${updatesByMorph[i]}`)
        }
      }
      
      utils.doUpdatesInChunks(connection, { updates }, numRowsUpdated => {
        if(numRowsUpdated != updates.length) throw new Error(`-----------> ERROR: Not everything got updated. Just ${numRowsUpdated}/${updates.length}.`)
        console.log(`    - ${numRowsUpdated} words updated.`)
        next()
      })

    })

  },

  removeNoteOnMatch: ({ connection, regex, except, addlWhere, next }) => {

    let select = `
      SELECT notes_enhanced.*, words_enhanced.word, words_enhanced.bookId, words_enhanced.chapter, words_enhanced.verse
      FROM notes_enhanced
        LEFT JOIN wordnote_enhanced ON (wordnote_enhanced.noteId = notes_enhanced.id)
        LEFT JOIN words_enhanced ON (wordnote_enhanced.wordId = words_enhanced.id)
      WHERE notes_enhanced.morph REGEXP '${regex.toString().replace(/^\/|\/[a-z]*$/g, '').replace(/\(\?:/g, '(')}'
    `

    if(except) {
      select += `
        AND notes_enhanced.morph NOT REGEXP '${except.toString().replace(/^\/|\/[a-z]*$/g, '').replace(/\(\?:/g, '(')}'
      `
    }

    if(addlWhere) {
      select += `
        AND (${addlWhere})
      `
    }

    connection.query(select, (err, result) => {
      if(err) throw err

      const parsingsToDelete = {}

      const updates = result.map(row => {
        if(row.verification) {
          console.log(`    >> WAS VERIFIED: ${row.word} | ${row.morph} | ${utils.getBibleBookName(row.bookId)} ${row.chapter}:${row.verse}`)
        } if(!parsingsToDelete[`${row.word} | ${row.morph}`]) {
          parsingsToDelete[`${row.word} | ${row.morph}`] = {
            info: `${row.word} | ${row.morph} | ${utils.getBibleBookName(row.bookId)} ${row.chapter}:${row.verse}`,
            addl: 0,
          }
        } else {
          parsingsToDelete[`${row.word} | ${row.morph}`].addl++
        }
      })

      for(let i in parsingsToDelete) {
        console.log(`    ${parsingsToDelete[i].info}` + (parsingsToDelete[i].addl ? ` (+${parsingsToDelete[i].addl} more)` : ``))
      }
      
    })

    utils.deleteNotesAndWordnoteRows({ connection, select }, next)
    
  },

  deleteRowsMadeByScript: ({ connection, enhancedTables=true }, done) => {

    // does a round-about way of deleting the rows since deleting rows is so slow in innodb

    const notesTable = enhancedTables ? 'notes_enhanced' : 'notes'
    const wordnoteTable = enhancedTables ? 'wordnote_enhanced' : 'wordnote'

    console.log(`\nDeleting unverified rows from ${notesTable} and ${wordnoteTable} that were created by the script...`)
    
    // rename the notes table to notes_rowsBeingDeleted
    // rename the wordnote table to wordnote_rowsBeingDeleted
    // create new notes and wordnote tables
    const statementSet1 = `
      RENAME TABLE ${notesTable} TO ${notesTable}_rowsBeingDeleted;
      RENAME TABLE ${wordnoteTable} TO ${wordnoteTable}_rowsBeingDeleted;
      CREATE TABLE ${notesTable} LIKE ${notesTable}_rowsBeingDeleted; 
      CREATE TABLE ${wordnoteTable} LIKE ${wordnoteTable}_rowsBeingDeleted; 
    `

    connection.query(statementSet1, (err, result) => {
      if(err) throw err
      
      // copy all the records over, except those to be deleted
      // drop old tables
      const statementSet2 = `
        INSERT ${notesTable}
          SELECT * FROM ${notesTable}_rowsBeingDeleted WHERE memberId!=416 OR verification=1;
        INSERT ${wordnoteTable}
          SELECT ${wordnoteTable}_rowsBeingDeleted.*
            FROM ${wordnoteTable}_rowsBeingDeleted
              LEFT JOIN ${notesTable}_rowsBeingDeleted ON (${notesTable}_rowsBeingDeleted.id = ${wordnoteTable}_rowsBeingDeleted.noteId)
            WHERE ${notesTable}_rowsBeingDeleted.memberId!=416 OR ${notesTable}_rowsBeingDeleted.verification=1;
        DROP TABLE IF EXISTS ${notesTable}_rowsBeingDeleted; 
        DROP TABLE IF EXISTS ${wordnoteTable}_rowsBeingDeleted; 
      `

      connection.query(statementSet2, (err, result) => {
        if(err) throw err

        console.log(`    - rows deleted.`)
        done()

      })
    })

  },

  deleteNotesAndWordnoteRows: ({ connection, select, report }, done) => {

    const outputInfo = {}

    connection.query(select, (err, result) => {
      if(err) throw err

      const updates = []

      result.forEach(row => {
        updates.push(`DELETE FROM notes_enhanced WHERE id=${row.id}`)
        updates.push(`DELETE FROM wordnote_enhanced WHERE noteId=${row.id}`)

        if(report) {
          const accentlessWord = utils.makeAccentless(row.word)
          if(!outputInfo[accentlessWord]) {
            outputInfo[accentlessWord] = {
              accentlessWord,
              hits: 0,
              parsings: {},
            }
          }
          if(!outputInfo[accentlessWord].parsings[row.morph]) {
            outputInfo[accentlessWord].parsings[row.morph] = 0
          }
          outputInfo[accentlessWord].hits++
          outputInfo[accentlessWord].parsings[row.morph]++
        }
      })

      if(report) {
        const outputList = Object.values(outputInfo)
        outputList.sort((a,b) => a.hits > b.hits ? 1 : -1)
        outputList.forEach(outputItem => {
          if(outputItem.hits < 5) return
          let parsingInfo = ""
          for(let parsing in outputItem.parsings) {
            parsingInfo += `${parsing} (${outputItem.parsings[parsing]}) `
          }
          console.log(`    ${outputItem.accentlessWord} ${parsingInfo}`)
        })
      }

      utils.doUpdatesInChunks(connection, { updates }, numRowsUpdated => {
        if(numRowsUpdated != updates.length) throw new Error(`-----------> ERROR: Not everything got deleted. Just ${numRowsUpdated}/${updates.length}.`)
        console.log(`    - ${numRowsUpdated} rows deleted`)
        done()
      })
    })

  },

  compareWithETCBC: ({ row, skipAddl=false }) => {

    let morph = row.morph
    let etcbcMorph = row.etcbcMorph

    if(row.lemma.match(/(^|\/)1368$/)) {
      etcbcMorph = etcbcMorph
        .replace(/^(H(?:[^\/]*\/)*)Nc/, '$1Aa')  // etcbc marks גבור as a noun
    }

    if(bothGenderLemmas.includes(row.lemma.replace(/^[^0-9]*/, ''))) {
      etcbcMorph = etcbcMorph
        .replace(/^(H(?:[^\/]*\/)*Nc)[mf]/, '$1b')  // force etcbc to mark these as both
    }

    if(morph == etcbcMorph) return "match"
    
    if(autoParseAndValidateMap[row.accentlessword] == morph) return "match"
    if(autoParseAndValidateMap[row.accentlessword] != null) return "no match"

    if(
      morph.replace(/^(H(?:[^\/]*\/)*[^\/]+)(\/S[^\/]+)$/, '$1') == etcbcMorph.replace(/^(H(?:[^\/]*\/)*(?:N[^\/][^\/][^\/]|A[^\/][^\/][^\/]|V[^\/][rs][^\/][^\/]))a/, '$1c')
      && morph.replace(/^(H(?:[^\/]*\/)*[^\/]+)(\/S[^\/]+)$/, '$2') == suffixParsingMap[row.accentlessword.replace(/^.*\/([^\/]+)$/, '$1')]
    ) return "match" 
    
    
    if(morph.match(/^(H(?:[^\/]*\/)*[^\/]+)\/Sp[123][mfc][sp]/)) {
      etcbcMorph = etcbcMorph
        .replace(/^(H(?:[^\/]*\/)*(?:N[^\/][^\/][^\/]|A[^\/][^\/][^\/]|V[^\/][rs][^\/][^\/]))a/, '$1c')  // etcbc does not mark words with a pronominal suffix as construct
    }

    if(row.lemma.match(/(^|\/)6440$/)) {
      etcbcMorph = etcbcMorph
        .replace(/^(H(?:[^\/]*\/)*Nc)m([^\/][^\/])/, '$1b$2')  // etcbc marks פנים as masc
    }

    if(morph.match(/^(H(?:[^\/]*\/)*)Ac/)) {
      // cardinal numbers not indicated in etcbc
      // etcbc marks gender on numbers differently
      etcbcMorph = etcbcMorph
        .replace(/^(H(?:[^\/]*\/)*)Nc[bmf]/, '$1Ncx')  
      morph = morph
        .replace(/^(H(?:[^\/]*\/)*)Ac[bmf]/, '$1Ncx')  
    }

    morph = morph
      .replace(/^(A(?:[^\/]*\/)*)Td/, '$1')  // definite article for Aramaic not indicated in etcbc
      .replace(/^(H(?:[^\/]*\/)*)Ao/, '$1Aa')  // ordinal numbers not indicated in etcbc
      .replace(/^(H(?:[^\/]*\/)*[^\/]+)\/S[^\/]+$/, '$1')  // suffixes not indicated in etcbc
      .replace(/^(H(?:[^\/]*\/)*)Ng([^\/][^\/][^\/])/, '$1Aa$2')  // gentilic nouns not indicated in etcbc
      .replace(/^(H(?:[^\/]*\/)*V[^\/])q/, '$1p')  // etcbc doesn't use WeQatal verb stem
      .replace(/^(H(?:[^\/]*\/)*V[^\/])h/, '$1i')  // etcbc doesn't indicate cohortatives
      .replace(/^(H(?:[^\/]*\/)*V[^\/])j/, '$1i')  // etcbc doesn't indicate jussives


    if(etcbcMorph.match(/^(H(?:[^\/]*\/)*N[^\/])b/)) {
      morph = morph
        .replace(/^(H(?:[^\/]*\/)*N[^\/])[mf]/, '$1b')  // ignore gender when etcbc marks it both (since these have been pre-decided)
    }

    if(morph.match(/^(H(?:[^\/]*\/)*N[^\/])b/)) {
      etcbcMorph = etcbcMorph
        .replace(/^(H(?:[^\/]*\/)*N[^\/])[mf]/, '$1b')  // ignore gender when we mark it both (since these have been pre-decided)
    }

    if(row.accentlessword.match(/(הִנֵּה|וְ\/הִנֵּה)/)) return "unknown" // etcbc marks this HTj
    if(row.accentlessword.match(/יֶשׁ/)) return "unknown" // etcbc marks this differently than us
    if(row.accentlessword.match(/יֵשׁ/)) return "unknown" // etcbc marks this differently than us

    if(skipAddl) {
      if(row.accentlessword.match(/כֵּן/)) return "unknown"
      if(row.accentlessword.match(/אַף/)) return "unknown"
      if(row.accentlessword.match(/שֹׁכְנִי/)) return "unknown"
      if(row.accentlessword.match(/שִׁבְתּ\/וֹ/)) return "unknown"
      if(row.accentlessword.match(/לְ\/בִלְתִּי/)) return "unknown"
      if(row.accentlessword.match(/^[א-ת]*$/)) return "unknown"   // etcbc is not trustworthy for words subject to a qere swap
    }

    return morph == etcbcMorph ? "unverified match" : "no match"
    
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

  },

  getBibleBookIdByAbbr: (abbr) => {
    
    return {
      "Gen": "1",
      "Exod": "2",
      "Lev": "3",
      "Num": "4",
      "Deut": "5",
      "Josh": "6",
      "Judg": "7",
      "1Sam": "8",
      "2Sam": "9",
      "1Kgs": "10",
      "2Kgs": "11",
      "Isa": "12",
      "Jer": "13",
      "Ezek": "14",
      "Hos": "15",
      "Joel": "16",
      "Amos": "17",
      "Obad": "18",
      "Jonah": "19",
      "Mic": "20",
      "Nah": "21",
      "Hab": "22",
      "Zeph": "23",
      "Hag": "24",
      "Zech": "25",
      "Mal": "26",
      "Ps": "27",
      "Prov": "28",
      "Job": "29",
      "Song": "30",
      "Ruth": "31",
      "Lam": "32",
      "Eccl": "33",
      "Esth": "34",
      "Dan": "35",
      "Ezra": "36",
      "Neh": "37",
      "1Chr": "38",
      "2Chr": "39",
    }[abbr]

  },
  
  // ARAMAIC PASSAGES:
    // Genesis 31:47 – translation of a Hebrew placename, Jegar-Sahadutha Strong's #H3026
    // Jeremiah 10:11 – a single sentence denouncing idolatry occurs in the middle of a Hebrew text.
    // Daniel 2:4b–7:28 – five stories about Daniel and his colleagues, and an apocalyptic vision.
    // Ezra 4:8–6:18 and 7:12–26 – quotations of documents from the 5th century BCE on the restoration of the Temple in Jerusalem.
  whereAramaic: `
    (
      (bookId=1 AND chapter=31 AND verse=47)
      OR (bookId=13 AND chapter=10 AND verse=11)
      OR (bookId=35 AND chapter=2 AND verse>=4)
      OR (bookId=35 AND chapter>2 AND chapter<7)
      OR (bookId=35 AND chapter=7 AND verse<=28)
      OR (bookId=36 AND chapter=4 AND verse>=8)
      OR (bookId=36 AND chapter=5)
      OR (bookId=36 AND chapter=6 AND verse<=18)
      OR (bookId=36 AND chapter=7 AND verse>=12)
      OR (bookId=36 AND chapter=7 AND verse<=26)
    )
  `

}
  
module.exports = utils
  