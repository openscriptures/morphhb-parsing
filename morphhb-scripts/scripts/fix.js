const utils = require('../utils')

module.exports = (connection, done) => {

  console.log(`\nRunning fix script...`)

  utils.runInSeries([

    (x, next) => {
      
      console.log(`  Words that end with a state of determined will be changed to absolute...`)

      // N???d
      // A???d
      // V?[rs]??d

      utils.runReplaceOnMorph({
        connection,
        table: 'notes',
        regex: /^(H(?:[^\/]*\/)*(?:N[^\/][^\/][^\/]|A[^\/][^\/][^\/]|V[^\/][rs][^\/][^\/]))d/,
        replace: '$1a',
        doVerified: true,
        next,
      })

    },

    (x, next) => {
      
      console.log(`  A Tp parsing (particle > definite article with inseparable preposition) will be change to Rd (preposition > definite article)...`)

      utils.runReplaceOnMorph({
        connection,
        table: 'notes',
        regex: /^(H(?:[^\/]*\/)*)Tp\//,
        replace: '$1Rd/',
        doVerified: true,
        next,
      })

    },

    (x, next) => {
      
      console.log(`  Cohortatives will be marked common gender if otherwise...`)

      // V?h?c?

      utils.runReplaceOnMorph({
        connection,
        table: 'notes',
        regex: /^(H(?:[^\/]*\/)*V[^\/]h[^\/])[^c]([^\/])/,
        replace: '$1c$2',
        doVerified: true,
        next,
      })

    },

    (x, next) => {
      
      console.log(`  Cohortatives will be marked 1st person if person is not indicated...`)

      // V?hx??

      utils.runReplaceOnMorph({
        connection,
        table: 'notes',
        regex: /^(H(?:[^\/]*\/)*V[^\/]h)x([^\/][^\/])/,
        replace: '$11$2',
        doVerified: true,
        next,
      })

    },

    (x, next) => {
      
      console.log(`  Imperatives will be marked 2rd person if person is not indicated...`)
      
      // V?vx??

      utils.runReplaceOnMorph({
        connection,
        table: 'notes',
        regex: /^(H(?:[^\/]*\/)*V[^\/]v)x([^\/][^\/])/,
        replace: '$12$2',
        doVerified: true,
        next,
      })

    },

    (x, next) => {
      
      console.log(`  Jussive will be marked 3rd person if person is not indicated...`)

      utils.runReplaceOnMorph({
        connection,
        table: 'notes',
        regex: /^(H(?:[^\/]*\/)*V[^\/]j)x([^\/][^\/])/,
        replace: '$13$2',
        doVerified: true,
        next,
      })

    },

    // Nouns, adjectives and participles will be marked absolute if their state is not indicated...
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
    // Proper nouns (Np) will have unneeded parsing info (anything after the p) removed
    // Infinitive constructs (V?c) and absolutes (V?a) will have unneeded parsing info (anything after the c or a) removed
    // Adjectives, pronouns, pronominal suffixes and verbs marked with a number of dual will be corrected to plural
    // Every double / will be changed to a single /. Eg. HR//Ncfpc -> HR/Ncfpc
    
    () => {
      console.log(`Done with fix script.`)
      done()
    }
  ])
}  