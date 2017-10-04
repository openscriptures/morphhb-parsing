// TODO
  // separate between Hebrew and Aramaic so that the same form with different lemma does not disqualify auto-parsing
  // 2chron seems to have a lot of messed up lemma data

const utils = require('../utils')

module.exports = (connection, done) => {
  
  console.log(`\nRunning auto-parse script...`)

  // Inserts new rows into notes_enhanced and wordnote_enhanced tables [and eventually also into notes and wordnote]
  // with memberid=0 where word morphology is missing and it can safely be determined from other human parsings.
  // Then reruns the compare script to have these new rows brought through to the words_enhanced table

  // Only seek to auto parse words without morph data
  let selectWordsWithoutMorph = `SELECT DISTINCT accentlessword, lemma FROM words_enhanced WHERE morph IS NULL`
  connection.query(selectWordsWithoutMorph, (err, result) => {
    if(err) throw err
    
    let uniqueWordsCount = 0
    const updateWordQueries = []

    const tryNextWord = () => {

      if(result.length > 0) {

        const rowWithoutMorph = result.shift()

        // Only uses forms which have been parsed 2+ times by humans, are not flagged as questionable, and in every
        // instance they have been parsed the same
        const selectWord = `SELECT morph, COUNT(morph) as cnt FROM words_enhanced
                            WHERE
                              accentlessword="${rowWithoutMorph.accentlessword}"
                              AND lemma="${rowWithoutMorph.lemma}"
                              AND morph IS NOT NULL
                              AND status IN ('single', 'confirmed', 'verified')
                            GROUP BY morph
                          `
        connection.query(selectWord, (err, result) => {
          if(err) throw err

          const autoParseWhere = `WHERE
            accentlessword="${rowWithoutMorph.accentlessword}"
            AND lemma="${rowWithoutMorph.lemma}"
            AND status IN ('none', 'conflict')
          `
  
          if(result.length == 1 && result[0].cnt >= 2) {
            uniqueWordsCount++
            updateWordQueries.push(`UPDATE words_enhanced SET morph='${result[0].morph}', status='single' ${autoParseWhere}`)
          }


          // Flag for manual check if there is only one outlier for a form that appears a lot, as I would hate for this
          // to ruin the auto-parsing
          if(result.length == 2 && (
            (result[0].cnt == 1 && result[1].cnt > 10)
            || (result[1].cnt == 1 && result[0].cnt > 10)
          )) {
            const outlier = result[1].cnt == 1 ? result[1] : result[0]
            const selectWordWithLocInfo = `SELECT bookId, chapter, verse FROM words_enhanced
                                            WHERE
                                              accentlessword="${rowWithoutMorph.accentlessword}"
                                              AND lemma="${rowWithoutMorph.lemma}"
                                              AND morph="${outlier.morph}"
                                              AND status IN ('single', 'confirmed', 'verified')
                                            LIMIT 1
                                          `
            connection.query(selectWordWithLocInfo, (err, result1) => {
              if(err) throw err
            
              const countPotentialAutoParsed = `SELECT COUNT(*) as cnt FROM words_enhanced ${autoParseWhere}`
              connection.query(countPotentialAutoParsed, (err, result2) => {
                if(err) throw err

                if(result2[0].cnt > 5) {
                  console.log(`  >> MANUAL CHECK: Check the outlier (${utils.getBibleBookName(result1[0].bookId)} ${result1[0].chapter}:${result1[0].verse}) for the accentless form ${rowWithoutMorph.accentlessword}. If it can be corrected, then ${result2[0].cnt} more words can be auto-parsed.`)
                }

                tryNextWord()
              })
            })

            return
          }

          tryNextWord()
  
        })

      } else {  // done composing updates

        // run updates
        utils.doUpdatesInChunks(connection, { updates: updateWordQueries }, numRowsUpdated => {

          console.log(`  ${numRowsUpdated} words auto-parsed from ${uniqueWordsCount} unique forms.`)

          console.log(`Done with auto-parse script.`)
          done()

        })
      }
    }

    tryNextWord()

  })

}