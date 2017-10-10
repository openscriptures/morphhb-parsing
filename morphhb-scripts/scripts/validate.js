module.exports = (connection, done) => {
  
  console.log(`\nRunning validate script...`)

  // Think through how/when this validation will change the status (for good or bad)

  // ETCBC doesn't use WeQatal verb stem, whereas OSHB may.
  // Adjective in ETCBC do not have cardinal or ordinal types

  console.log(`Done with validate script.`)
  done()

}  