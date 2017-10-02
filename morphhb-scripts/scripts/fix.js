const utils = require('../utils')

module.exports = (connection, done) => {

  console.log(`\nRunning fix script...`)

  utils.runInSeries([

    // Words with a state of determined will be changed to absolute
    (x, next) => {

      const test = "SELECT 1"
      connection.query(test, (err, result) => {
        if(err) throw err

        console.log('test')
        next()
      })
    },

    // A Tp parsing (particle > definite article with inseparable preposition) will be change to Rd (preposition > definite article)
    // Cohortatives will have their person removed (marked ‘x’) if present
    // Cohortatives will be marked common gender if otherwise
    // imperatives will have their person removed (marked ‘x’) if present
    // Jussive will be marked 3rd person if person is not indicated
    // Nouns, adjectives and participles will be marked absolute if their state is not indicated
    // Verbs marked perfect 3rd person plural masculine will be corrected to common gender
    // Verbs marked imperfect 3rd person plural common will be corrected to masculine gender
    // Verbs marked sequential (perfect or imperfect) which are missing the indication of the conjunction will be corrected to include the conjunction. Eg. HVqw3fs -> HC/Vqw3fs
    // Multi-part words with the last part marked a personal pronoun, and with an adjective, noun, preposition or verb in the second to last part, will be corrected to be a pronominal suffix
    // Nouns, adjectives and participles with a pronominal suffix and marked with a state of absolute will be corrected to have a state of construct
    // Words with definite article and marked construct will be corrected to be marked absolute
    // Nouns with a common gender will be corrected to both
    // Demonstrative, relative and personal pronouns, pronominal suffixes and verbs with a both gender will be corrected to common
    // Demonstrative and relative pronouns will have person removed (marked ‘x’) if it is indicated
    // Indefinite and interrogative pronouns will have unneeded parsing info removed and be reduced to Pf and Pi
    // Directional/paragogic ה and ן will have unneeded parsing info removed and be reduced to Sd, Sh or Sn
    // Perfect and imperfect verbs (including sequentials), pronouns and pronominal suffixes in 1st person will be marked common gender
    // Infinitive constructs (V?c) and absolutes (V?a) will have unneeded parsing info (anything after the c or a) removed
    // Adjectives, pronouns, pronominal suffixes and verbs marked with a number of dual will be corrected to plural  


    () => {
      console.log(`Done with fix script.`)
      done()
    }
  ])
}  