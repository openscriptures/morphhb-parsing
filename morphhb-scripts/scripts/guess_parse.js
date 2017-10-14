const MINIMUM_PERCENTAGE_OF_UNIFORMITY_FOR_GUESS = 70

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

    result = result.filter(row => !blacklistedForms.includes(row.accentlessword))
    
    let uniqueWordsCount = 0
    const updateWordQueries = []
    const outlierOutput = []

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

          // Look for situations where simple auto-parsing is not possible
          // - conj + perfect vs sequential perfect
          // - 2nd/3rd jussive vs 2nd/3rd imperfect
          // - absolute vs construct
          // - both vs masc vs fem
          // - imperfect 3fs vs 3ms  "HVqi3fs", (81%) -- but HVqi2ms
          const noSimpleAutoParse = mainMorph && outliers.length > 0 && outliers.some(outlier => {
            return [
              [/^(HC\/V[^\/])[pq]([^\/][^\/][^\/])/, '$1-$2'],
              [/^(H(?:[^\/]*\/)*V[^\/])[ij]([23][^\/][^\/])/, '$1-$2'],
              [/^(H(?:[^\/]*\/)*(?:N[^\/][^\/][^\/]|A[^\/][^\/][^\/]|V[^\/][rs][^\/][^\/]))[ac]/, '$1-'],
              [/^(H(?:[^\ /]*\/)*(?:N[^\/]|A[^\/]))[bfm]/, '$1-'],
              [/^(H(?:[^\ /]*\/)*V[^\/][iw])(?:3fs|2ms)/, '$1-'],
            ].some(replaceCheck => (
              mainMorph.replace(replaceCheck[0], replaceCheck[1]) == outlier.morph.replace(replaceCheck[0], replaceCheck[1])
            ))
          })
                          
          if(mainMorph && totalWithThisForm >= 2 && !noSimpleAutoParse) {
            uniqueWordsCount++
            updateWordQueries.push(`UPDATE words_enhanced SET morph='${mainMorph}', status='single' ${autoParseWhere}`)

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
              
                const outlierExamples = []
                let totalOutliers = 0
                results.forEach((result, index) => {
                  totalOutliers += outliers[index].cnt
                  outlierExamples.push(`${outliers[index].morph} in ${utils.getBibleBookName(result[0].bookId)} ${result[0].chapter}:${result[0].verse} `
                    + (outliers[index].cnt > 1 ? `(+${outliers[index].cnt-1} more)` : ``))
                })
                outlierOutput.push(`${('000' + totalOutliers).substr(-3)}  >> "${rowWithoutMorph.accentlessword}": "${mainMorph}", (${mainMorphPercentage}%) -- but ${outlierExamples.join(', ')}`)

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

        outlierOutput.sort()
        outlierOutput.forEach(outlierLine => {
          console.log(outlierLine.substr(3))
        })
        
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

const blacklistedForms = [
  // don't guess parse these
  "מִמֶּ/נּוּ",
  "מִי",
  "מָה",
  "פַּרְעֹה",
  "עִמָּ/ךְ",
  "אָחִי/ךָ",
  "דַּבֵּר",
  "הִוא",
] 
