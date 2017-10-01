const utils = require('../utils')

module.exports = (connection, done) => {
  
  console.log(`\nRunning auto-parse script...`)

  // Inserts new rows into notes_enhanced and wordnote_enhanced tables [and eventually also into notes and wordnote]
  // with memberid=0 where word morphology is missing and it can safely be determined from other human parsings.
  // Then reruns the compare script to have these new rows brought through to the words_enhanced table

  // Only seek to auto parse words without morph data
  let selectWordsWithoutMorph = `SELECT DISTINCT word, lemma FROM words_enhanced WHERE morph IS NULL`
  connection.query(selectWordsWithoutMorph, (err, result) => {
    if(err) throw err
    
    let lastWord = ``
    let uniqueWordsCount = 0
    let totalWordsCount = 0
    let updateWordQueries = ``

    const rowsToUse = result.filter(row => {
      if(lastWord == row.word) {
        // unsafe to try to auto-parse a word with multiple lemmas
        console.log(`  Skipping ${row.word} since this form is a representation of multiple lemmas and thus unsafe to auto-parse.`)
        return false
      }

      lastWord = row.word

      return true
    })

    const tryNextWord = () => {

      if(rowsToUse.length > 0) {

        const rowWithoutMorph = rowsToUse.shift()
  
        // Only uses forms which have been parsed 2+ times by humans, are not flagged as questionable, and in every
        // instance they have been parsed the same
        let selectWord = `SELECT morph, COUNT(morph) as cnt FROM words_enhanced
                            WHERE word="${rowWithoutMorph.word}" AND morph IS NOT NULL AND status IN ('single', 'confirmed', 'verified')
                            GROUP BY morph`
        connection.query(selectWord, (err, result) => {
          if(err) throw err
  
          if(result.length == 1 && result[0].cnt >= 2) {
            uniqueWordsCount++
            updateWordQueries += `UPDATE words_enhanced SET morph='${result[0].morph}'
                                    WHERE word="${rowWithoutMorph.word}" AND morph IS NULL;`
            // updateWordQueries += `SELECT COUNT(*) as cnt FROM words_enhanced
            //                         WHERE word="${rowWithoutMorph.word}" AND morph IS NULL;`

          }


          // Flag for manual check if there is only one outlier for a form that appears a lot, as I would hate for this
          // to ruin the auto-parsing
          if(result.length == 2 && (
            (result[0].cnt == 1 && result[1].cnt > 10)
            || (result[1].cnt == 1 && result[0].cnt > 10)
          )) {
            console.log(`  >> MANUAL CHECK: See if the outlier for the form ${rowWithoutMorph.word} is invalid, and if so flag it as questionable so that this form can be auto-parsed.`)
          }

          tryNextWord()
  
        })

      } else {  // done composing updates

        // run updates
        connection.query(updateWordQueries, (err, result) => {
          if(err) throw err
          
          result.forEach(updateResult => {
            totalWordsCount += updateResult.affectedRows
            // totalWordsCount += updateResult[0].cnt
          })

          console.log(`  ${totalWordsCount} words auto-parsed from ${uniqueWordsCount} unique forms.`)

          console.log(`Done with auto-parse script.`)
          done()

        })
      }
    }

    tryNextWord()

  })      



}


// same lemma!