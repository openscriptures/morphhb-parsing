module.exports = (connection, done) => {
  
  console.log(`Running auto-parse script...`)

  // Inserts new rows into notes_enhanced and wordnote_enhanced tables [and eventually also into notes and wordnote]
  // with memberid=0 where word morphology is missing and it can safely be determined from other human parsings.
  // Then reruns the compare script to have these new rows brought through to the words_enhanced table

  // Only seek to auto parse words without morph data
  let selectWordsWithoutMorph = `SELECT * FROM words_enhanced WHERE morph IS NULL ORDER BY morph`
  connection.query(selectWordsWithoutMorph, (err, result) => {
    if(err) throw err
    
    // result.forEach(row =>  {
    //   // console.log(row)
    //   return true
    // })
    console.log(`words without morph: ${result.length}`)

    console.log(`Done with auto-parse script.`)
    done()
  })      

  // Only uses forms which have been parsed 2+ times by humans, are not flagged as questionable, and in every
  // instance they have been parsed the same
  
  // Flag for manual check if there is only one outlier for a form that appears a lot, as I would hate for this
  // to ruin the auto-parsing


}  