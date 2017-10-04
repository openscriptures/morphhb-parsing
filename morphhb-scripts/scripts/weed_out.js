const utils = require('../utils')

module.exports = (connection, done) => {
  
  console.log(`\nRunning weed-out script...`)

  utils.runInSeries([

    // (x, next) => {
      
    //   console.log(`  Number of morph parts must match the number of word parts...`)

    // },

    // (x, next) => {
      
    //   console.log(`  Must contain valid parsing letter combo (test with existing parser validator)...`)

    // },

    (x, next) => {
      
      console.log(`  Must have a POS indicated...`)

      utils.removeNoteOnMatch({
        connection,
        regex: /^H$/,
        next,
      })

    },

    (x, next) => {
      
      console.log(`  Adjectives and nouns must have type, gender, number and state indicated, except for proper nouns...`)

      utils.removeNoteOnMatch({
        connection,
        regex: /^H([^\/]*\/)*[AN](\/|$|([^\/p]|[^\/][^\/]|[^\/][^\/][^\/])(\/|$))/,
        next,
      })

    },

    (x, next) => {
      
      console.log(`  Pronouns and particles must have type indicated...`)

      utils.removeNoteOnMatch({
        connection,
        regex: /^H([^\/]*\/)*[PT](\/|$)/,
        next,
      })

    },

    (x, next) => {
      
      console.log(`  Personal pronouns and pronominal suffixes must have person, gender and number indicated...`)

      utils.removeNoteOnMatch({
        connection,
        regex: /^H([^\/]*\/)*[PS]p(\/|$|([^\/]|[^\/][^\/])(\/|$))/,
        next,
      })

    },

    (x, next) => {
      
      console.log(`  Cohortatives must be 1st person...`)

      utils.removeNoteOnMatch({
        connection,
        regex: /^H([^\/]*\/)*V[^\/]h[^1]/,
        next,
      })

    },

    (x, next) => {
      
      console.log(`  Imperatives must be 2nd person...`)

      utils.removeNoteOnMatch({
        connection,
        regex: /^H([^\/]*\/)*V[^\/]v[^2]/,
        next,
      })

    },

    (x, next) => {
      
      console.log(`  Jussives must be 2nd or 3rd person...`)

      utils.removeNoteOnMatch({
        connection,
        regex: /^H([^\/]*\/)*V[^\/]j[^23]/,
        next,
      })

    },
    
    (x, next) => {
      
      console.log(`  Adjectives must have a gender of masculine or feminine...`)

      utils.removeNoteOnMatch({
        connection,
        regex: /^H([^\/]*\/)*A[^\/][^fm]/,
        next,
      })

    },
    
    (x, next) => {
      
      console.log(`  Adjectives, pronouns (personal and demonstrative) and pronominal suffixes must have a number of plural or singular...`)

      utils.removeNoteOnMatch({
        connection,
        regex: /^H([^\/]*\/)*(A[^\/][^\/]|P[pd][^\/][^\/]|Sp[^\/][^\/])[^ps]/,
        next,
      })

    },
    
    // (x, next) => {
      
    //   console.log(`  Directional/paragogic ה and paragogic ן must consist of ה or ן...`)

    // },
    
    // (x, next) => {
      
    //   console.log(`  Definite article (Td) must consist of a ה...`)

    // },
    
    // (x, next) => {
      
    //   console.log(`  Direct object marker (To) must consist of את...`)

    // },

    (x, next) => {
      
      console.log(`  Verbs must have stem and aspect indicated...`)

      utils.removeNoteOnMatch({
        connection,
        regex: /^H([^\/]*\/)*V(\/|$|[^\/](\/|$))/,
        next,
      })

    },

    (x, next) => {
      
      console.log(`  Infinitive absolutes cannot be a part of a multi-part word...`)

      utils.removeNoteOnMatch({
        connection,
        regex: /^(H([^\/]*\/)+V[^\/]a|HV[^\/]a.)/,
        next,
      })

    },

    (x, next) => {
      
      console.log(`  Participles must have a masculine or feminine gender...`)

      utils.removeNoteOnMatch({
        connection,
        regex: /^H([^\/]*\/)*V[^\/][rs][^mf]/,
        next,
      })

    },

    // (x, next) => {
      
    //   console.log(`  Sequential perfects and imperfects must be have a conjunction prefix...`)

    // },

    (x, next) => {
      
      console.log(`  Perfect verbs (including sequentials) that are 2nd person or 3rd person singular must be masculine or feminine gender...`)

      utils.removeNoteOnMatch({
        connection,
        regex: /^H([^\/]*\/)*V[^\/][pq][23][^mf]s/,
        next,
      })

    },

    (x, next) => {
      
      console.log(`  Imperfect verbs (including sequentials) that are 2nd person or 3rd person, along with jussives and imperatives, must be masculine or feminine gender...`)

      utils.removeNoteOnMatch({
        connection,
        regex: /^H([^\/]*\/)*V[^\/][iwjv][23][^mf]/,
        next,
      })

    },

    // (x, next) => {
      
    //   console.log(`  Parsings should not contain an x in the middle, except for demonstrative pronouns...`)

    // },

    () => {
      console.log(`Done with weed-out script.`)
      done()
    }
  ])
  
}  