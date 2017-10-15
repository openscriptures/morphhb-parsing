module.exports = (connection, done) => {
  
  console.log(`\nRunning validate script...`)

  // Think through how/when this validation will change the status (for good or bad)

  // ETCBC doesn't use WeQatal verb stem, whereas OSHB may.
  // Adjective in ETCBC do not have cardinal or ordinal types

        // ETCBC does not parse suffixes, although they are (to some degree) stored in a separate column in the database. OSHB does parse them, so need to work with that.
      // Often when a word has a suffix, ETCBC parses it as absolute, whereas OSHB parses it as construct.

  console.log(`Done with validate script.`)
  done()

}  