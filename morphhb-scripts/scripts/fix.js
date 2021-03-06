const utils = require('../utils')
const { bothGenderLemmas } = require('../mappings')

module.exports = (connection, done) => {

  console.log(`\nRunning fix script...`)

  utils.runInSeries([

    (x, next) => {
      
      console.log(`  Parsings without language indicated will be marked Hebrew...`)

      utils.runReplaceOnMorph({
        connection,
        table: 'notes',
        regex: /^([^HA])/,
        replace: 'H$1',
        doVerified: true,
        next,
      })

    },

    (x, next) => {
      
      console.log(`  Parsings with Hebrew marked more than once in the word will be corrected (eg. HC/HR/Np > HC/R/Np)...`)

      utils.runReplaceOnMorph({
        connection,
        table: 'notes',
        regex: /^(H(?:[^\/]*\/)*)H/,
        replace: '$1',
        doVerified: true,
        next,
      })

    },

    (x, next) => {
      
      console.log(`  Nouns, adjectives and participles that end with a state of determined will be changed to absolute...`)

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
      
      console.log(`  A R/Tp parsing (particle > definite article with inseparable preposition) will be change to Rd (preposition > definite article)...`)

      utils.runReplaceOnMorph({
        connection,
        table: 'notes',
        regex: /^(H(?:[^\/]*\/)*)R\/Tp\//,
        replace: '$1Rd/',
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

    (x, next) => {

      console.log(`  Nouns, adjectives and participles will be marked construct if their state is not indicated and they have a pronominal suffix...`)
    
      // N???/Sp
      // A???/Sp
      // V?[rs]??/Sp

      utils.runReplaceOnMorph({
        connection,
        table: 'notes',
        regex: /^(H(?:[^\/]*\/)*(?:N[^\/][^\/][^\/]|A[^\/][^\/][^\/]|V[^\/][rs][^\/][^\/]))(\/Sp)/,
        replace: '$1c$2',
        doVerified: true,
        next,
      })

    },

    (x, next) => {

      console.log(`  Nouns, adjectives and participles will be marked absolute if their state is not indicated and they do not have a pronominal suffix...`)
    
      // N???
      // A???
      // V?[rs]??

      utils.runReplaceOnMorph({
        connection,
        table: 'notes',
        regex: /^(H(?:[^\/]*\/)*(?:N[^\/][^\/][^\/]|A[^\/][^\/][^\/]|V[^\/][rs][^\/][^\/]))(\/|$)/,
        replace: '$1a$2',
        doVerified: true,
        next,
      })

    },

    (x, next) => {

      console.log(`  Verbs marked perfect (including sequentials) 3rd person plural masculine will be corrected to common gender...`)
    
      // V?[pq]3mp

      utils.runReplaceOnMorph({
        connection,
        table: 'notes',
        regex: /^(H(?:[^\/]*\/)*V[^\/][pq]3)m(p)/,
        replace: '$1c$2',
        doVerified: true,
        next,
      })

    },

    (x, next) => {

      console.log(`  Verbs marked imperfect (including sequentials) 3rd person plural common will be corrected to masculine gender...`)
    
      // V?[iw]3cp

      utils.runReplaceOnMorph({
        connection,
        table: 'notes',
        regex: /^(H(?:[^\/]*\/)*V[^\/][iw]3)c(p)/,
        replace: '$1m$2',
        doVerified: true,
        next,
      })

    },

    (x, next) => {

      console.log(`  Verbs marked sequential (perfect or imperfect) which are missing the indication of the conjunction will be corrected to include the conjunction. Eg. HVqw3fs -> HC/Vqw3fs...`)
    
      // V?[qw]

      utils.runReplaceOnMorph({
        connection,
        table: 'notes',
        regex: /^(H)(V[^\/][qw])/,
        replace: '$1C/$2',
        doVerified: true,
        next,
      })

    },

    (x, next) => {

      console.log(`  Get rid of trailing slashes...`)
    
      utils.runReplaceOnMorph({
        connection,
        table: 'notes',
        regex: /\/+$/,
        replace: '',
        // doVerified: true,
        next,
      })

    },

    (x, next) => {

      console.log(`  Multi-part words with the last part marked a personal pronoun, and with an adjective, noun, preposition (usually), or verb in the second to last part, will be corrected to be a pronominal suffix...`)
    
      // /[ANRV]/Pp???

      // there are a handful of places where a preposition can combine with a personal pronoun. eg. בָּ/הֵֽמָּה
      // however, since most of the time this needs to be corrected, we will just correct all but those that are verified

      utils.runReplaceOnMorph({
        connection,
        table: 'notes',
        regex: /^(H(?:[^\/]*\/)*[ANRV][^\/]*\/)Pp([^\/][^\/][^\/])/,
        replace: '$1Sp$2',
        // doVerified: true,
        next,
      })

    },

    (x, next) => {

      console.log(`  Words with definite article and marked construct will be corrected to be marked absolute...`)
    
      // /[ANRV]/Pp???

      utils.runReplaceOnMorph({
        connection,
        table: 'notes',
        regex: /^(H(?:[^\/]*\/)*(?:Rd|Td)\/(?:N[^\/][^\/][^\/]|A[^\/][^\/][^\/]|V[^\/][rs][^\/][^\/]))c/,
        replace: '$1a',
        // doVerified: true,
        next,
      })

    },

    (x, next) => {

      console.log(`  Nouns with a common gender will be corrected to both...`)
    
      // N?c

      utils.runReplaceOnMorph({
        connection,
        table: 'notes',
        regex: /^(H(?:[^\/]*\/)*N[^\/])c/,
        replace: '$1b',
        doVerified: true,
        next,
      })

    },

    (x, next) => {

      console.log(`  Demonstrative, relative and personal pronouns, pronominal suffixes and verbs with a both gender will be corrected to common...`)
    
      // P[dpr]?b
      // Sp?b
      // V?[rs]b
      // V?[pqiwhjv]?b

      utils.runReplaceOnMorph({
        connection,
        table: 'notes',
        regex: /^(H(?:[^\/]*\/)*(?:P[dpr][^\/]|Sp[^\/]|V[^\/][rs]|V[^\/][pqiwhjv][^\/]))b/,
        replace: '$1c',
        doVerified: true,
        next,
      })

    },

    (x, next) => {

      console.log(`  Demonstrative and relative pronouns will have person removed (marked ‘x’) if it is indicated...`)
    
      // P[dr][123]

      utils.runReplaceOnMorph({
        connection,
        table: 'notes',
        regex: /^(H(?:[^\/]*\/)*P[dr])[123]/,
        replace: '$1x',
        doVerified: true,
        next,
      })

    },

    (x, next) => {

      console.log(`  Indefinite and interrogative pronouns will have unneeded parsing info removed and be reduced to Pf and Pi...`)
    
      // P[fi]???

      utils.runReplaceOnMorph({
        connection,
        table: 'notes',
        regex: /^(H(?:[^\/]*\/)*P[fi])[^\/]+/,
        replace: '$1',
        doVerified: true,
        next,
      })

    },

    (x, next) => {

      console.log(`  Directional/paragogic ה and ן will have unneeded parsing info removed and be reduced to Sd, Sh or Sn...`)
    
      // P[fi]???

      utils.runReplaceOnMorph({
        connection,
        table: 'notes',
        regex: /^(H(?:[^\/]*\/)*S[dhn])[^\/]+/,
        replace: '$1',
        doVerified: true,
        next,
      })

    },

    (x, next) => {

      console.log(`  Perfect and imperfect verbs (including sequentials), pronouns and pronominal suffixes in 1st person will be marked common gender...`)
    
      // V?[pqiw]1[bmfx]
      // P?1[bmfx]
      // Sp1[bmfx]

      utils.runReplaceOnMorph({
        connection,
        table: 'notes',
        regex: /^(H(?:[^\/]*\/)*(?:V[^\/][pqiw]|P[^\/]|Sp)1)[bmfx]/,
        replace: '$1c',
        doVerified: true,
        next,
      })

    },
    
    (x, next) => {

      console.log(`  Proper nouns (Np) will have unneeded parsing info (anything after the p) removed...`)
    
      // Np

      utils.runReplaceOnMorph({
        connection,
        table: 'notes',
        regex: /^([HA](?:[^\/]*\/)*Np)[^\/]+/,
        replace: '$1',
        doVerified: true,
        next,
      })

    },

    (x, next) => {

      console.log(`  Infinitive constructs (V?c) and absolutes (V?a) will have unneeded parsing info (anything after the c or a) removed...`)
    
      // V?[ca]

      utils.runReplaceOnMorph({
        connection,
        table: 'notes',
        regex: /^(H(?:[^\/]*\/)*V[^\/][ca])[^\/]+/,
        replace: '$1',
        doVerified: true,
        next,
      })

    },

    (x, next) => {

      console.log(`  Adjectives (except for cardinal numbers), pronouns, pronominal suffixes and verbs marked with a number of dual will be corrected to plural...`)
    
      // A[ago]?d
      // P???d
      // Sp??d
      // V?[rs]?d
      // V?[pqiwhjv]??d

      utils.runReplaceOnMorph({
        connection,
        table: 'notes',
        regex: /^(H(?:[^\/]*\/)*(?:A[ago][^\/]|P[^\/][^\/][^\/]|Sp[^\/][^\/]|V[^\/][rs][^\/]|V[^\/][pqiwhjv][^\/][^\/]))d/,
        replace: '$1p',
        doVerified: true,
        next,
      })

    },

    (x, next) => {

      console.log(`  Every double / will be changed to a single /. Eg. HR//Ncfpc -> HR/Ncfpc...`)
    
      // A??d
      // P???d
      // Sp??d
      // V?[rs]?d
      // V?[pqiwhjv]??d

      utils.runReplaceOnMorph({
        connection,
        table: 'notes',
        regex: /\/\/+/g,
        replace: '/',
        // doVerified: true,
        next,
      })

    },

    (x, next) => {

      console.log(`  Every gentilic adjective will be corrected to be a gentilic noun...`)
    
      // Ag???

      utils.runReplaceOnMorph({
        connection,
        table: 'notes',
        regex: /^(H(?:[^\/]*\/)*)A(g[^\/][^\/][^\/])/,
        replace: '$1N$2',
        doVerified: true,
        next,
      })

    },

    (x, next) => {

      console.log(`  Get rid of x's at the end of a parsing...`)
    
      utils.runReplaceOnMorph({
        connection,
        table: 'notes',
        regex: /^(H(?:[^\/]*\/)*[^\/]*[^\/x])x+(\/|$)/,
        replace: '$1$2',
        doVerified: true,
        next,
      })

    },
    
    (x, next) => {

      console.log(`  Adjectives with type of x will be changed to a...`)
    
      utils.runReplaceOnMorph({
        connection,
        table: 'notes',
        regex: /^(H(?:[^\/]*\/)*A)x/,
        replace: '$1a',
        doVerified: true,
        next,
      })

    },

    (x, next) => {

      console.log(`  Interrogative pronouns will be changed to interrogative particles (Pi > Ti)...`)
    
      utils.runReplaceOnMorph({
        connection,
        table: 'notes',
        regex: /^(H(?:[^\/]*\/)*)P(i)/,
        replace: '$1T$2',
        doVerified: true,
        next,
      })

    },

    (x, next) => {

      console.log(`  Demonstrative pronouns with missing x for the person will be corrected...`)
    
      utils.runReplaceOnMorph({
        connection,
        table: 'notes',
        regex: /^(H(?:[^\/]*\/)*Pd)([mfc][sp])/,
        replace: '$1x$2',
        doVerified: true,
        next,
      })

    },

    (x, next) => {

      console.log(`  Pronominal suffixes with incorrect code (eg. S3mp should be Sp3mp) will be corrected...`)
    
      utils.runReplaceOnMorph({
        connection,
        table: 'notes',
        regex: /^(H(?:[^\/]*\/)*S)([123][mfc][sp])/,
        replace: '$1p$2',
        doVerified: true,
        next,
      })

    },

    (x, next) => {

      console.log(`  Pual/hophal/etc active participles will be corrected to be passive participles...`)
      
      utils.runReplaceOnMorph({
        connection,
        table: 'notes',
        regex: /^(H(?:[^\/]*\/)*V[PHOMKQLD])r/,
        replace: '$1s',
        doVerified: true,
        next,
      })

    },

    (x, next) => {

      console.log(`  Make all both gender nouns to be parsed as both in every instance...`)

      // get all nouns with a gender, with their lemma
      const select = `
        SELECT 
          notes_enhanced.id,
          notes_enhanced.morph,
          words_enhanced.lemma
        FROM notes_enhanced
          LEFT JOIN wordnote_enhanced ON (wordnote_enhanced.noteId = notes_enhanced.id)
          LEFT JOIN words_enhanced ON (wordnote_enhanced.wordId = words_enhanced.id)
        WHERE 
          notes_enhanced.morph REGEXP '^H([^\/]*\/)*(N[^\/]|Ac)[mfb]'
      `
  
      connection.query(select, (err, result) => {
        if(err) throw err

        // see which nouns need updating
        const updates = []
        const lemmasMadeBoth = {}
        const lemmasWithMorphThrownOut = {}

        result.forEach(row => {
          const nakedLemma = row.lemma.split('/').pop()
          const shouldBeParsedBoth = bothGenderLemmas.includes(nakedLemma)
          const isParsedBoth = !!row.morph.match(/^H([^\/]*\/)*(?:N[^\/])b/)

          if(shouldBeParsedBoth && !isParsedBoth) {
            updates.push(`UPDATE notes_enhanced SET morph="${row.morph.replace(/^(H(?:[^\/]*\/)*(?:N[^\/]|Ac))[mf](.*)$/, '$1b$2')}" WHERE id="${row.id}"`)
            lemmasMadeBoth[nakedLemma] = true
            
          } else if(!shouldBeParsedBoth && isParsedBoth) {
            // invalidate it so it gets thrown out
            updates.push(`UPDATE notes_enhanced SET morph="-" WHERE id="${row.id}"`)
            lemmasWithMorphThrownOut[nakedLemma] = true
            
          }
        })
  
        utils.doUpdatesInChunks(connection, { updates }, numRowsUpdated => {
          if(numRowsUpdated != updates.length) throw new Error(`-----------> ERROR: Not everything got updated. Just ${numRowsUpdated}/${updates.length}.`)
          console.log(`    ${Object.keys(lemmasMadeBoth).length} lemmas conformed to gender both.`)
          console.log(`    ${Object.keys(lemmasWithMorphThrownOut).length} lemmas where the morph was thrown out because it was incorrectly marked gender both.`)
          Object.keys(lemmasWithMorphThrownOut).forEach(nakedLemma => {
            console.log(`      ${nakedLemma}`)
          })
          console.log(`    - ${numRowsUpdated} words updated.`)
          next()
        })
      })

    },

    (x, next) => {

      console.log(`  Add article to the end of the morph of Aramaic words ending in /א and missing a word part in the indicated morph...`)

      const select = `
        SELECT tbl.id, tbl.morph, tbl.morphSeparators, tbl.wordSeparators FROM (
          SELECT 
            notes_enhanced.id,
            notes_enhanced.morph,    
            words_enhanced.accentlessword,    
            (LENGTH(notes_enhanced.morph) - LENGTH( REPLACE ( notes_enhanced.morph, "/", "") ) ) as morphSeparators,
            (LENGTH(words_enhanced.accentlessword) - LENGTH( REPLACE ( words_enhanced.accentlessword, "/", "") ) ) as wordSeparators
          FROM notes_enhanced
            LEFT JOIN wordnote_enhanced ON (wordnote_enhanced.noteId = notes_enhanced.id)
            LEFT JOIN words_enhanced ON (wordnote_enhanced.wordId = words_enhanced.id)
        ) as tbl WHERE tbl.morphSeparators != tbl.wordSeparators AND tbl.morph LIKE "A%" AND tbl.accentlessword LIKE "%/א"
      `

      connection.query(select, (err, result) => {
        if(err) throw err

        const updates = []

        result.forEach(row => {
          if(parseInt(row.morphSeparators) + 1 == parseInt(row.wordSeparators)) {
            updates.push(`UPDATE notes_enhanced SET morph="${row.morph + "/Td"}" WHERE id="${row.id}"`)
          }
        })

        utils.doUpdatesInChunks(connection, { updates }, numRowsUpdated => {
          if(numRowsUpdated != updates.length) throw new Error(`-----------> ERROR: Not everything got updated. Just ${numRowsUpdated}/${updates.length}.`)
          console.log(`    - ${numRowsUpdated} words updated.`)
          next()
        })

      })

    },

    (x, next) => {

      console.log(`  Add article to the end of the morph of Aramaic words where the morph ends in d...`)

      const select = `
        SELECT tbl.id, tbl.morph, tbl.morphSeparators, tbl.wordSeparators FROM (
          SELECT 
            notes_enhanced.id,
            notes_enhanced.morph,    
            words_enhanced.accentlessword,    
            (LENGTH(notes_enhanced.morph) - LENGTH( REPLACE ( notes_enhanced.morph, "/", "") ) ) as morphSeparators,
            (LENGTH(words_enhanced.accentlessword) - LENGTH( REPLACE ( words_enhanced.accentlessword, "/", "") ) ) as wordSeparators
          FROM notes_enhanced
            LEFT JOIN wordnote_enhanced ON (wordnote_enhanced.noteId = notes_enhanced.id)
            LEFT JOIN words_enhanced ON (wordnote_enhanced.wordId = words_enhanced.id)
        ) as tbl WHERE tbl.morphSeparators != tbl.wordSeparators AND tbl.morph LIKE "A%d" AND tbl.accentlessword NOT LIKE "%/א"
    `

      connection.query(select, (err, result) => {
        if(err) throw err

        const updates = []

        result.forEach(row => {
          if(parseInt(row.morphSeparators) + 1 == parseInt(row.wordSeparators)) {
            updates.push(`UPDATE notes_enhanced SET morph="${row.morph + "/Td"}" WHERE id="${row.id}"`)
          }
        })

        utils.doUpdatesInChunks(connection, { updates }, numRowsUpdated => {
          if(numRowsUpdated != updates.length) throw new Error(`-----------> ERROR: Not everything got updated. Just ${numRowsUpdated}/${updates.length}.`)
          console.log(`    - ${numRowsUpdated} words updated.`)
          next()
        })

      })

    },

    () => {
      console.log(`Done with fix script.`)
      done()
    }
  ])

}  