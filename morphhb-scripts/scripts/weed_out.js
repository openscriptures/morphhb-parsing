const utils = require('../utils')
const codeValidator = require('../code_validator')

module.exports = (connection, done) => {
  
  console.log(`\nRunning weed-out script...`)

  utils.runInSeries([

    (x, next) => {
      
      console.log(`  Number of morph parts must match the number of word parts...`)

      const select = `
        SELECT tbl.id, tbl.morph, tbl.word FROM (
          SELECT 
            notes_enhanced.id,
            notes_enhanced.morph,    
            words_enhanced.word,    
            (LENGTH(notes_enhanced.morph) - LENGTH( REPLACE ( notes_enhanced.morph, "/", "") ) ) as morphSeparators,
            (LENGTH(words_enhanced.word) - LENGTH( REPLACE ( words_enhanced.word, "/", "") ) ) as wordSeparators
          FROM notes_enhanced
            LEFT JOIN wordnote_enhanced ON (wordnote_enhanced.noteId = notes_enhanced.id)
            LEFT JOIN words_enhanced ON (wordnote_enhanced.wordId = words_enhanced.id)
        ) as tbl WHERE tbl.morphSeparators != tbl.wordSeparators      
      `

      utils.deleteNotesAndWordnoteRows({ connection, select, report: true }, next)

    },

    (x, next) => {
      
      console.log(`  Must contain valid parsing letter combo (test with existing parser validator)...`)

      const select = `SELECT DISTINCT morph FROM notes_enhanced`

      connection.query(select, (err, result) => {
        if(err) throw err

        const badMorphs = []

        result.forEach(row => {
          const morphFirstLetter = row.morph.substr(0,1)
          if(!codeValidator.parsingCodeIsValid(row.morph) || !row.morph.substr(1).split('/').every(morphPart => codeValidator.parsingCodeIsValid(morphFirstLetter + morphPart))) {
            console.log(`    ${row.morph} is invalid`)
            badMorphs.push(`"${row.morph}"`)
          }
        })

        const select = `SELECT id FROM notes_enhanced WHERE morph IN(${badMorphs.join(',')})`
        utils.deleteNotesAndWordnoteRows({ connection, select }, next)

      })
      
    },

    (x, next) => {
      
      console.log(`  Must have a POS indicated...`)

      utils.removeNoteOnMatch({
        connection,
        regex: /^H(\/|$)/,
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
      
      console.log(`  Participles must have gender, number and state indicated...`)

      utils.removeNoteOnMatch({
        connection,
        regex: /^H([^\/]*\/)*V[^\/][rs](\/|$|([^\/p]|[^\/][^\/])(\/|$))/,
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
      
      console.log(`  Adjectives must have a gender of masculine, feminine or both...`)

      utils.removeNoteOnMatch({
        connection,
        regex: /^H([^\/]*\/)*A[ago][^fmb]/,
        next,
      })

    },
    
    (x, next) => {
      
      console.log(`  Adjectives (except for cardinal numbers), pronouns (personal and demonstrative) and pronominal suffixes must have a number of plural or singular...`)

      utils.removeNoteOnMatch({
        connection,
        regex: /^H([^\/]*\/)*(A[ago][^\/]|P[pd][^\/][^\/]|Sp[^\/][^\/])[^ps]/,
        next,
      })

    },
    
    // (x, next) => {
      
    //   console.log(`  Directional/paragogic ה and paragogic ן must consist of ה or ן...`)

    //   const updates = `
    //     DELETE FROM notes_enhanced WHERE id IN (
    //       SELECT 
    //         notes_enhanced.id,
    //       FROM notes_enhanced
    //         LEFT JOIN wordnote_enhanced ON (wordnote_enhanced.noteId = notes_enhanced.id)
    //         LEFT JOIN words_enhanced ON (wordnote_enhanced.wordId = words_enhanced.id)
    //       WHERE 
    //         notes_enhanced.morph REGEXP '^H([^\/]*\/)*S[dh]$'
    //         AND words_enhanced.word NOT REGEXP 'ה$'
    //     )
    //   `

    //   utils.doUpdatesInChunks(connection, { updates }, numRowsUpdated => {
    //     if(err) throw err
        
    //     next()
    //   })

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
      
      console.log(`  Participles must have a masculine or feminine gender...`)

      utils.removeNoteOnMatch({
        connection,
        regex: /^H([^\/]*\/)*V[^\/][rs][^mf]/,
        next,
      })

    },

    (x, next) => {
      
      console.log(`  Sequential perfects and imperfects must be have a conjunction prefix...`)

      utils.removeNoteOnMatch({
        connection,
        regex: /^H([^\/]*\/)*V[^\/][qw]/,
        except: /^HC\/V[^\/][qw]/,
        next,
      })

    },

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

    (x, next) => {
      
      console.log(`  Parsings should not contain an x in the middle, except for demonstrative pronouns...`)

      utils.removeNoteOnMatch({
        connection,
        regex: /^H.*x[^\/]/,
        except: /^H([^\/]*\/)*Pd/,
        next,
      })

    },

    (x, next) => {
      
      console.log(`  Demonstrative pronouns must have gender and number indicated...`)
      
      utils.removeNoteOnMatch({
        connection,
        regex: /^H([^\/]*\/)*Pd/,
        except: /^H([^\/]*\/)*Pdx[^\/][^\/]/,
        next,
      })

    },

    (x, next) => {
      
      console.log(`  אַחַר cannot be an adjective...`)
      
      utils.removeNoteOnMatch({
        connection,
        regex: /^H([^\/]*\/)*A/,
        addlWhere: `words_enhanced.lemma LIKE '310 a' OR words_enhanced.lemma LIKE '%/310 a'`,
        next,
      })

    },

    () => {
      console.log(`Done with weed-out script.`)
      done()
    }
  ])
  
}  