const MINIMUM_PERCENTAGE_OF_UNIFORMITY_FOR_GUESS = 90

const utils = require('../utils')

module.exports = (connection, done) => {
  
  console.log(`\nRunning guess-parse script...`)

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

          let totalWithThisForm = 0
          result.forEach(row => totalWithThisForm += row.cnt)

          let mainMorph
          let mainMorphPercentage
          const outliers = []

          result.forEach(row => {
            if(row.cnt / totalWithThisForm >= MINIMUM_PERCENTAGE_OF_UNIFORMITY_FOR_GUESS/100) {
              mainMorphPercentage = parseInt((row.cnt / totalWithThisForm) * 100)
              mainMorph = row.morph
            } else {
              outliers.push(row)
            }
          })
  
          if(mainMorph && totalWithThisForm >= 2) {
            uniqueWordsCount++
            updateWordQueries.push(`UPDATE words_enhanced SET morph='${result[0].morph}', status='single' ${autoParseWhere}`)

            if(outliers.length > 0) {
              const selectWordWithLocInfo = outliers.map(outlier => `
                SELECT bookId, chapter, verse FROM words_enhanced
                  WHERE
                    accentlessword="${rowWithoutMorph.accentlessword}"
                    AND lemma="${rowWithoutMorph.lemma}"
                    AND morph="${outlier.morph}"
                    AND status IN ('single', 'confirmed', 'verified')
                  LIMIT 1
              `)
              connection.query(selectWordWithLocInfo.join(';'), (err, results) => {
                if(err) throw err

                if(selectWordWithLocInfo.length == 1) {
                  results = [ results ]
                }
              
                results.forEach((result, index) => {
                  console.log(`  >> OUTLIER: ${rowWithoutMorph.accentlessword} is parsed ${mainMorph} ${mainMorphPercentage}% of the time, `
                    + `but in ${utils.getBibleBookName(result[0].bookId)} ${result[0].chapter}:${result[0].verse} `
                    + (outliers[index].cnt > 1 ? `(and ${outliers[index].cnt-1} other places) ` : ``)
                    + `it is parsed ${outliers[index].morph}.`)
                })

                tryNextWord()
              })
            } else {
              tryNextWord()
            }
          } else {
            tryNextWord()
          }

        })

      } else {  // done composing updates

        // run updates
        utils.doUpdatesInChunks(connection, { updates: updateWordQueries }, numRowsUpdated => {

          console.log(`  ${numRowsUpdated} words guess-parsed from ${uniqueWordsCount} unique forms.`)

          console.log(`Done with guess-parse script.`)
          done()

        })
      }
    }

    tryNextWord()

  })

}