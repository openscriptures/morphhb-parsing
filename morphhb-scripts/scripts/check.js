module.exports = (connection, done) => {
  
  console.log(`\nRunning check script...`)

  // delete notes_enhanced (and wordnote_enhanced) rows based upon a check against the etcbc

  // ETCBC doesn't use WeQatal verb stem, whereas OSHB may.
  // Adjective in ETCBC do not have cardinal or ordinal types
  // ETCBC does not parse suffixes, although they are (to some degree) stored in a separate column in the database. OSHB does parse them, so need to work with that.
  // Often when a word has a suffix, ETCBC parses it as absolute, whereas OSHB parses it as construct.
  
  console.log(`Done with check script.`)
  done()

}  