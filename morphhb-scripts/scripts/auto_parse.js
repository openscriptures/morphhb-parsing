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
    let count = 0

    result.forEach(row => {
      if(lastWord == row.word) {
        // unsafe to try to auto-parse a word with multiple lemmas
        console.log(`  Skipping ${row.word} since this form is a representation of multiple lemmas and thus unsafe to auto-parse.`)
      }
      count++
      lastWord = row.word
    })

    console.log(`unique words without morph: ${count}`)

    console.log(`Done with auto-parse script.`)
    done()
  })      

  // Only uses forms which have been parsed 2+ times by humans, are not flagged as questionable, and in every
  // instance they have been parsed the same
  
  // Flag for manual check if there is only one outlier for a form that appears a lot, as I would hate for this
  // to ruin the auto-parsing


}  