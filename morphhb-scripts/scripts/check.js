const utils = require('../utils')

// flag notes_enhanced entries that do not match. then, preference away from those in the compare script

module.exports = (connection, done) => {
  
  console.log(`\nRunning check script...`)

  utils.runInSeries([

    (x, next) => {
      
      console.log(`  Add the etcbcnomatch column...`)
      utils.addColumn(connection, {
        table: 'notes',
        col: 'etcbcnomatch',
        colDef: 'TINYINT(1)',
        afterCol: 'verification',
      }, next)  
    },

    (x, next) => {
      
      console.log(`  Flag notes_enhanced entries that do not match...`)

      const statement = `
        SELECT
          notes_enhanced.id,
          notes_enhanced.morph,
          etcbc_enhanced.morph as etcbcMorph,
          words_enhanced.accentlessword,
          words_enhanced.bookId,
          words_enhanced.chapter,
          words_enhanced.verse,
          words_enhanced.lemma
        FROM notes_enhanced
          LEFT JOIN wordnote_enhanced ON (wordnote_enhanced.noteId = notes_enhanced.id)
          LEFT JOIN words_enhanced ON (wordnote_enhanced.wordId = words_enhanced.id)
          LEFT JOIN etcbc_enhanced ON (etcbc_enhanced.id = words_enhanced.id)
        WHERE
          etcbc_enhanced.morph != notes_enhanced.morph
      `

      connection.query(statement, (err, result) => {
        if(err) throw err
        
        const updates = []
        let mismatchedWords = {}

        result.forEach(row => {

          const compareResult = utils.compareWithETCBC({ row })

          if(compareResult == "unknown") return
          if(compareResult == "match") return

          updates.push(`UPDATE notes_enhanced SET etcbcnomatch=1 WHERE id=${row.id}`)

          if(!mismatchedWords[row.accentlessword]) {
            mismatchedWords[row.accentlessword] = {
              accentlessword: row.accentlessword,
              morph: row.morph,
              etcbcMorph: row.etcbcMorph,
              num: 0,
            }
          }
          mismatchedWords[row.accentlessword].num++
        })

        mismatchedWords = Object.values(mismatchedWords)
        mismatchedWords.sort((a,b) => (a.num > b.num ? 1 : -1))
        mismatchedWords.forEach(mismatchedWord => {
          if(mismatchedWord.num >= 5) {
            console.log(`    ${mismatchedWord.accentlessword} ${mismatchedWord.morph} ${mismatchedWord.etcbcMorph} (${mismatchedWord.num}x)`)
          }
        })

        utils.doUpdatesInChunks(connection, { updates }, numRowsUpdated => {
          if(numRowsUpdated != updates.length) throw new Error(`-----------> ERROR: Not everything got updated. Just ${numRowsUpdated}/${updates.length}.`)
          console.log(`    - ${updates.length} entries flagged.`)
          next()                
        })
              
      })
          
    },

    () => {
      console.log(`Done with check script.`)
      done()
    }
  ])
    
}  