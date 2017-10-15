const utils = require('../utils')

module.exports = (connection, done) => {
  
  console.log(`\nRunning check script...`)

  // delete notes_enhanced (and wordnote_enhanced) rows based upon a check against the etcbc

// instead of deleting, flag notes_enhanced entries that do not match. then, preference away from those in the compare script and mark the word conflict if I must use it

  // const statement = `
  //   SELECT notes_enhanced.id, notes_enhanced.morph, etcbc_enhanced.morph as etcbcMorph, words_enhanced.word, words_enhanced.bookId, words_enhanced.chapter, words_enhanced.verse
  //   FROM notes_enhanced
  //     LEFT JOIN wordnote_enhanced ON (wordnote_enhanced.noteId = notes_enhanced.id)
  //     LEFT JOIN words_enhanced ON (wordnote_enhanced.wordId = words_enhanced.id)
  //     LEFT JOIN etcbc_enhanced ON (etcbc_enhanced.id = words_enhanced.id)
  //   WHERE
  //     etcbc_enhanced.morph != notes_enhanced.morph
  //     AND notes_enhanced.morph NOT REGEXP '^H([^\/]*\/)*A[co]'
  //     AND notes_enhanced.morph NOT REGEXP '^A([^\/]*\/)*Td'
  // `

  // ignore gender? (when etcbc marks it both?)
  // ignore suffixes
  // ignore gentilic nouns
  // can I trust construct/absolute?
  // particles parsed differently?

  // etcbc marks למה as a single Ti (no preposition)
  // etcbc marks אין as a noun


  // connection.query(statement, (err, result) => {
  //   if(err) throw err

  //   const updates = []

  //   utils.doUpdatesInChunks(connection, { updates }, numRowsUpdated => {
  //     console.log(`    - done.`)
  //     next()                
  //   })
          
  // })

  

  // ETCBC doesn't use WeQatal verb stem, whereas OSHB may.
  // Adjective in ETCBC do not have cardinal or ordinal types
  // ETCBC does not parse suffixes, although they are (to some degree) stored in a separate column in the database. OSHB does parse them, so need to work with that.
  // Often when a word has a suffix, ETCBC parses it as absolute, whereas OSHB parses it as construct.
  
  console.log(`Done with check script.`)
  done()

}  