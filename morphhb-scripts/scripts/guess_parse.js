const MINIMUM_PERCENTAGE_OF_UNIFORMITY_FOR_GUESS = 50  // this does more good than bad at 50, do keeping it

const utils = require('../utils')

module.exports = (connection, done) => {
  
  console.log(`\nRunning guess-parse script...`)

  // Inserts new rows into notes_enhanced and wordnote_enhanced tables [and eventually also into notes and wordnote]
  // with memberid=0 where word morphology is missing and it can safely be determined from other human parsings.
  // Then reruns the compare script to have these new rows brought through to the words_enhanced table

  // Only seek to auto parse words without morph data
  let selectWordsWithoutMorph = `
    SELECT
      DISTINCT accentlessword, lemma
      FROM words_enhanced
      WHERE
        (morph IS NULL OR noguess IS NOT NULL OR status="conflict")
        AND NOT ${utils.whereAramaic}
      `
  connection.query(selectWordsWithoutMorph, (err, result) => {
    if(err) throw err

    result = result.filter(row => !blacklistedForms.includes(row.accentlessword))
    
    let uniqueWordsCount = 0
    let uniqueWordsCount2 = 0
    let totalWordsWithUnknownState = 0
    let totalNotSimpleToParse = 0
    const updateWordQueries = []
    const updateWordQueries2 = []
    const outlierOutput = []
    const constructAbsolutesToGuess = []

    const tryNextWord = () => {

      if(result.length > 0) {

        const rowWithoutMorph = result.shift()

        const selectWord = `SELECT morph, COUNT(morph) as cnt FROM words_enhanced
                            WHERE
                              accentlessword="${rowWithoutMorph.accentlessword}"
                              AND lemma="${rowWithoutMorph.lemma}"
                              AND morph IS NOT NULL
                              AND status IN ('single', 'confirmed', 'verified')
                              AND noguess IS NULL
                              AND NOT ${utils.whereAramaic}
                            GROUP BY morph
                          `
        connection.query(selectWord, (err, result) => {
          if(err) throw err

          const autoParseWhere = `WHERE
            accentlessword="${rowWithoutMorph.accentlessword}"
            AND lemma="${rowWithoutMorph.lemma}"
            AND (status IN ('none', 'conflict') OR noguess IS NOT NULL)
            AND NOT ${utils.whereAramaic}
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
          // - jussives/cohortatives vs imperfects
          // - both vs masc vs fem
          // - imperfect 3fs vs 3ms  "HVqi3fs", (81%) -- but HVqi2ms
          // - absolute vs construct
          const noSimpleAutoParse = mainMorph && outliers.length > 0 && outliers.some(outlier => {
            return [
              [/^(HC\/V[^\/])[pq]([^\/][^\/][^\/])/, '$1-$2'],
              [/^(H(?:[^\/]*\/)*V[^\/])[ijc]([^\/][^\/][^\/])/, '$1-$2'],
              // [/^(H(?:[^\ /]*\/)*(?:N[^\/]|A[^\/]))[fm]/, '$1b'],
              // [/^(H(?:[^\ /]*\/)*V[^\/][iw])(?:3fs|2ms)/, '$1-'],
            ].some(replaceCheck => (
              mainMorph.replace(replaceCheck[0], replaceCheck[1]) == outlier.morph.replace(replaceCheck[0], replaceCheck[1])
            ))
          })
          const canBeAbsoluteOrConstruct = mainMorph && outliers.length > 0 && outliers.some(outlier => {
            return [
              [/^(H(?:[^\/]*\/)*(?:N[^\/][^\/][^\/]|A[^\/][^\/][^\/]|V[^\/][rs][^\/][^\/]))[ac]/, '$1-'],
            ].some(replaceCheck => (
              mainMorph.replace(replaceCheck[0], replaceCheck[1]) == outlier.morph.replace(replaceCheck[0], replaceCheck[1])
            ))
          })
                          
          if(mainMorph && totalWithThisForm >= 1 && !noSimpleAutoParse) {

            if(canBeAbsoluteOrConstruct) {

              constructAbsolutesToGuess.push({
                autoParseWhere,
                mainMorph,
                accentlessword: rowWithoutMorph.accentlessword,
              })

              tryNextWord()
              
            } else {
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
                      AND NOT ${utils.whereAramaic}
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
            }

          } else if(mainMorph) {

            const select = `SELECT * FROM words_enhanced ${autoParseWhere}`
            connection.query(select, (err, results) => {
              if(err) throw err

              totalNotSimpleToParse += results.length
              tryNextWord()
            })

          } else {
            tryNextWord()
          }

        })

      } else {  // done composing base updates

        outlierOutput.sort()
        outlierOutput.forEach(outlierLine => {
          console.log(outlierLine.substr(3))
        })
        
        // run updates
        utils.doUpdatesInChunks(connection, { updates: updateWordQueries }, numRowsUpdated => {

          console.log(`  ${numRowsUpdated} words guess-parsed from ${uniqueWordsCount} unique forms.`)
          console.log(`  ** ${totalNotSimpleToParse} have multiple valid parsings and thus were not guess-parsed`)          

          
          // now do the guesses for words that could be either construct or absolute
          ;(async () => {

            const cannotDetermineStateOfWords = {}

            for(let i=0; i<constructAbsolutesToGuess.length; i++) {
              const constructAbsoluteToGuess = constructAbsolutesToGuess[i]
              const { autoParseWhere, mainMorph, accentlessword } = constructAbsoluteToGuess

              // each instance needs to be evaluated to be construct or absolute based on context
              
              const stateSelect1 = `SELECT * FROM words_enhanced ${autoParseWhere}`
              const stateResults1 = await new Promise((resolve, reject) => {
                connection.query(stateSelect1, (err, results) => {
                  if(err) throw err
                  resolve(results)
                })
              })

              const constructMorph = mainMorph.replace(/^(H(?:[^\/]*\/)*(?:N[^\/][^\/][^\/]|A[^\/][^\/][^\/]|V[^\/][rs][^\/][^\/]))[ac]/, '$1c')
              const absoluteMorph = mainMorph.replace(/^(H(?:[^\/]*\/)*(?:N[^\/][^\/][^\/]|A[^\/][^\/][^\/]|V[^\/][rs][^\/][^\/]))[ac]/, '$1a')
  
              for(let j=0; j<stateResults1.length; j++) {
                const stateRow1 = stateResults1[j]
                
                if(
                  stateRow1.append == "־"
                  || stateRow1.accentlessword.match(/ֵי$/)
                ) {
                  // construct if
                    // with dash
                    // ends with 2dots-yud
                    uniqueWordsCount2++
                  updateWordQueries2.push(`UPDATE words_enhanced SET morph='${constructMorph}', status='single' WHERE id=${stateRow1.id}`)
                } else if(
                  stateRow1.accentlessword.match(/ִים$/)
                  || stateRow1.accentlessword.match(/ָה$/)
                  || stateRow1.accentlessword.match(/^הַ\//)
                  || stateRow1.word.match(/[֑|֔֗|]/)
                ) {
                  // absolute if
                    // ends in yud-mem OR patach-hey
                    // has definite article
                    // has disjunctive accent
                  uniqueWordsCount2++
                  updateWordQueries2.push(`UPDATE words_enhanced SET morph='${absoluteMorph}', status='single' WHERE id=${stateRow1.id}`)
                } else {

                  const stateSelect2 = `
                    SELECT * FROM words_enhanced
                      WHERE
                        bookId=${stateRow1.bookId}
                        AND chapter=${stateRow1.chapter}
                        AND verse=${stateRow1.verse}
                      ORDER BY number
                  `
                  const stateResults2 = await new Promise((resolve, reject) => {
                    connection.query(stateSelect2, (err, results) => {
                      if(err) throw err
                      resolve(results)
                    })
                  })

                  const prevWord = stateRow1.wordtype == 'qere' ? stateResults2[stateRow1.number-2] : stateResults2[stateRow1.number-1]
                  const nextWord = !stateResults2[stateRow1.number+1]
                    ? null
                    : stateResults2[stateRow1.number+1].wordtype == 'qere'
                      ? stateResults2[stateRow1.number+2]
                      : stateResults2[stateRow1.number+1]

                  if(
                    stateRow1.number == stateResults2.length - 1
                    || (
                      prevWord
                      && prevWord.append == "־"
                      && stateRow1.append != "־"
                    )
                    || (nextWord && nextWord.morph && !nextWord.morph.match(/^H(?:[^\/]*\/)*(?:N|A|V[^\/][rs])/))
                    || (nextWord && nextWord.morph && nextWord.morph.match(/^H[CR]/))
                  ) {
                    // absolute if
                      // last in verse
                      // dash before but not after
                      // following word is
                        // not noun, adj or participle
                        // has a preposition or conjunction
                    uniqueWordsCount2++
                    updateWordQueries2.push(`UPDATE words_enhanced SET morph='${absoluteMorph}', status='single' WHERE id=${stateRow1.id}`)
                  } else if(
                    (nextWord && nextWord.morph && nextWord.morph.match(/^H(?:[^\/]*\/)*Np/))
                    || (nextWord && nextWord.morph && nextWord.morph.match(/^HTd/))
                    || (nextWord && nextWord.morph && nextWord.morph.match(/^H(?:[^\/]*\/)*N/) && stateRow1.word.match(/ֽ|֣|֥/))
                  ) {
                    // construct if
                      // proper name follows
                      // noun with definite article follows
                      // following word is noun and has this word has a conjunctive accent
                    uniqueWordsCount2++
                    updateWordQueries2.push(`UPDATE words_enhanced SET morph='${constructMorph}', status='single' WHERE id=${stateRow1.id}`)
                  } else {

                    // we don't really know if it should be absolute or construct, but guess at it nonetheless
                    uniqueWordsCount2++
                    updateWordQueries2.push(`UPDATE words_enhanced SET morph='${mainMorph}', status='single' WHERE id=${stateRow1.id}`)
                    
                    // totalWordsWithUnknownState++
                    // if(!cannotDetermineStateOfWords[accentlessword]) {
                    //   cannotDetermineStateOfWords[accentlessword] = 0
                    // }
                    // cannotDetermineStateOfWords[accentlessword]++
                  }

                }
              }
            }

            // run updates
            utils.doUpdatesInChunks(connection, { updates: updateWordQueries2 }, numRowsUpdated => {
              console.log(`  ${numRowsUpdated} words guess-parsed after state was determined.`)
              console.log(`  ** ${totalWordsWithUnknownState} words can be guess-parsed if I can determine their state (${Object.keys(cannotDetermineStateOfWords).length} unique forms)`)
      
              console.log(`Done with guess-parse script.`)
              done()
            })

          })()

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
