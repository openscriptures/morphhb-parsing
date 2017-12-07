const utils = require('../utils')
const { autoParseMap, autoParseAndValidateMap } = require('../mappings')

module.exports = (connection, done) => {
  
  console.log(`\nRunning auto-parse script...`)

  // Updates the words_enhanced table [and eventually will also insert into the notes and wordnote table with memberid=416]
  // according to pre-determined parsing for common forms

  utils.runInSeries([

    (x, next) => {

      const updates = []

      for(let form in autoParseMap) {
        updates.push(`
          UPDATE words_enhanced SET morph='${autoParseMap[form]}', status='single'
            WHERE 
              accentlessword='${form}'
              AND status NOT IN('confirmed', 'verified')
              AND NOT ${utils.whereAramaic}
        `)
      }

      for(let form in autoParseAndValidateMap) {
        updates.push(`
          UPDATE words_enhanced SET morph='${autoParseAndValidateMap[form]}', status='single'
            WHERE 
              accentlessword='${form}'
              AND NOT ${utils.whereAramaic}
        `)
      }

      utils.doUpdatesInChunks(connection, { updates }, numRowsUpdated => {
        console.log(`  ${numRowsUpdated} words were auto-parsed according to pre-determined parsing for common forms.`)
        next()
            
      })

    },

    (x, next) => {

      // parse proper nouns (according to bdb) as such

      const select = `
        SELECT
          words_enhanced.id
        FROM
          words_enhanced
          LEFT JOIN bdb ON (words_enhanced.lemma=bdb.id)
        WHERE
          bdb.pos LIKE "n-pr%"
          AND words_enhanced.morph IS NULL
          AND NOT ${utils.whereAramaic}
      `

      connection.query(select, (err, result) => {
        if(err) throw err

        const updates = result.map(row => `
          UPDATE words_enhanced SET morph="HNp", status='single', noguess=1 WHERE id=${row.id}
        `)

        utils.doUpdatesInChunks(connection, { updates }, numRowsUpdated => {
          console.log(`  ${numRowsUpdated} words were auto-parsed to HNp according to their BDB entry.`)
          next()
        })
            
      })

    },

    (x, next) => {

      // parse proper nouns (according to bdb) as such

      const select = `
        SELECT
          words_enhanced.id
        FROM
          words_enhanced
          LEFT JOIN bdb ON (words_enhanced.lemma=CONCAT('c/', bdb.id))
        WHERE
          bdb.pos LIKE "n-pr%"
          AND words_enhanced.morph IS NULL
          AND NOT ${utils.whereAramaic}
      `

      connection.query(select, (err, result) => {
        if(err) throw err

        const updates = result.map(row => `
          UPDATE words_enhanced SET morph="HC/Np", status='single', noguess=1 WHERE id=${row.id}
        `)

        utils.doUpdatesInChunks(connection, { updates }, numRowsUpdated => {
          console.log(`  ${numRowsUpdated} words were auto-parsed to HC/Np according to their BDB entry.`)
          next()
        })
            
      })

    },

    (x, next) => {

      // parse proper nouns (according to bdb) as such

      const select = `
        SELECT
          words_enhanced.id
        FROM
          words_enhanced
          LEFT JOIN bdb ON (words_enhanced.lemma=CONCAT('l/', bdb.id))
        WHERE
          bdb.pos LIKE "n-pr%"
          AND words_enhanced.morph IS NULL
          AND NOT ${utils.whereAramaic}
      `

      connection.query(select, (err, result) => {
        if(err) throw err

        const updates = result.map(row => `
          UPDATE words_enhanced SET morph="HR/Np", status='single', noguess=1 WHERE id=${row.id}
        `)

        utils.doUpdatesInChunks(connection, { updates }, numRowsUpdated => {
          console.log(`  ${numRowsUpdated} words were auto-parsed to HR/Np according to their BDB entry.`)
          next()
        })
            
      })

    },

    (x, next) => {

      // parse proper nouns (according to bdb) as such

      const select = `
        SELECT
          words_enhanced.id
        FROM
          words_enhanced
          LEFT JOIN bdb ON (words_enhanced.lemma=CONCAT('b/', bdb.id))
        WHERE
          bdb.pos LIKE "n-pr%"
          AND words_enhanced.morph IS NULL
          AND NOT ${utils.whereAramaic}
      `

      connection.query(select, (err, result) => {
        if(err) throw err

        const updates = result.map(row => `
          UPDATE words_enhanced SET morph="HR/Np", status='single', noguess=1 WHERE id=${row.id}
        `)

        utils.doUpdatesInChunks(connection, { updates }, numRowsUpdated => {
          console.log(`  ${numRowsUpdated} words were auto-parsed to HR/Np according to their BDB entry.`)
          next()
        })
            
      })

    },

    (x, next) => {

      // parse proper nouns (according to bdb) as such

      const select = `
        SELECT
          words_enhanced.id
        FROM
          words_enhanced
          LEFT JOIN bdb ON (words_enhanced.lemma=CONCAT('m/', bdb.id))
        WHERE
          bdb.pos LIKE "n-pr%"
          AND words_enhanced.morph IS NULL
          AND NOT ${utils.whereAramaic}
      `

      connection.query(select, (err, result) => {
        if(err) throw err

        const updates = result.map(row => `
          UPDATE words_enhanced SET morph="HR/Np", status='single', noguess=1 WHERE id=${row.id}
        `)

        utils.doUpdatesInChunks(connection, { updates }, numRowsUpdated => {
          console.log(`  ${numRowsUpdated} words were auto-parsed to HR/Np according to their BDB entry.`)
          next()
        })
            
      })

    },

    (x, next) => {

      // parse proper nouns (according to bdb) as such

      const select = `
        SELECT
          words_enhanced.id
        FROM
          words_enhanced
          LEFT JOIN bdb ON (words_enhanced.lemma=CONCAT('k/', bdb.id))
        WHERE
          bdb.pos LIKE "n-pr%"
          AND words_enhanced.morph IS NULL
          AND NOT ${utils.whereAramaic}
      `

      connection.query(select, (err, result) => {
        if(err) throw err

        const updates = result.map(row => `
          UPDATE words_enhanced SET morph="HR/Np", status='single', noguess=1 WHERE id=${row.id}
        `)

        utils.doUpdatesInChunks(connection, { updates }, numRowsUpdated => {
          console.log(`  ${numRowsUpdated} words were auto-parsed to HR/Np according to their BDB entry.`)
          next()
        })
            
      })

    },

    (x, next) => {

      // parse proper nouns (according to bdb) as such

      const select = `
        SELECT
          words_enhanced.id
        FROM
          words_enhanced
          LEFT JOIN bdb ON (words_enhanced.lemma=CONCAT('d/', bdb.id))
        WHERE
          bdb.pos LIKE "n-pr%"
          AND words_enhanced.morph IS NULL
          AND NOT ${utils.whereAramaic}
      `

      connection.query(select, (err, result) => {
        if(err) throw err

        const updates = result.map(row => `
          UPDATE words_enhanced SET morph="HTd/Np", status='single', noguess=1 WHERE id=${row.id}
        `)

        utils.doUpdatesInChunks(connection, { updates }, numRowsUpdated => {
          console.log(`  ${numRowsUpdated} words were auto-parsed to HTd/Np according to their BDB entry.`)
          next()
        })
            
      })

    },

    (x, next) => {

      // parse proper nouns (according to bdb) as such

      const select = `
        SELECT
          words_enhanced.id
        FROM
          words_enhanced
          LEFT JOIN bdb ON (words_enhanced.lemma=CONCAT('c/l/', bdb.id))
        WHERE
          bdb.pos LIKE "n-pr%"
          AND words_enhanced.morph IS NULL
          AND NOT ${utils.whereAramaic}
      `

      connection.query(select, (err, result) => {
        if(err) throw err

        const updates = result.map(row => `
          UPDATE words_enhanced SET morph="HC/R/Np", status='single', noguess=1 WHERE id=${row.id}
        `)

        utils.doUpdatesInChunks(connection, { updates }, numRowsUpdated => {
          console.log(`  ${numRowsUpdated} words were auto-parsed to HC/R/Np according to their BDB entry.`)
          next()
        })
            
      })

    },

    (x, next) => {

      // parse proper nouns (according to bdb) as such

      const select = `
        SELECT
          words_enhanced.id
        FROM
          words_enhanced
          LEFT JOIN bdb ON (words_enhanced.lemma=CONCAT('c/b/', bdb.id))
        WHERE
          bdb.pos LIKE "n-pr%"
          AND words_enhanced.morph IS NULL
          AND NOT ${utils.whereAramaic}
      `

      connection.query(select, (err, result) => {
        if(err) throw err

        const updates = result.map(row => `
          UPDATE words_enhanced SET morph="HC/R/Np", status='single', noguess=1 WHERE id=${row.id}
        `)

        utils.doUpdatesInChunks(connection, { updates }, numRowsUpdated => {
          console.log(`  ${numRowsUpdated} words were auto-parsed to HC/R/Np according to their BDB entry.`)
          next()
        })
            
      })

    },

    (x, next) => {

      // parse proper nouns (according to bdb) as such

      const select = `
        SELECT
          words_enhanced.id
        FROM
          words_enhanced
          LEFT JOIN bdb ON (words_enhanced.lemma=CONCAT('c/m/', bdb.id))
        WHERE
          bdb.pos LIKE "n-pr%"
          AND words_enhanced.morph IS NULL
          AND NOT ${utils.whereAramaic}
      `

      connection.query(select, (err, result) => {
        if(err) throw err

        const updates = result.map(row => `
          UPDATE words_enhanced SET morph="HC/R/Np", status='single', noguess=1 WHERE id=${row.id}
        `)

        utils.doUpdatesInChunks(connection, { updates }, numRowsUpdated => {
          console.log(`  ${numRowsUpdated} words were auto-parsed to HC/R/Np according to their BDB entry.`)
          next()
        })
            
      })

    },

    (x, next) => {

      // parse proper nouns (according to bdb) as such

      const select = `
        SELECT
          words_enhanced.id
        FROM
          words_enhanced
          LEFT JOIN bdb ON (words_enhanced.lemma=CONCAT('c/k/', bdb.id))
        WHERE
          bdb.pos LIKE "n-pr%"
          AND words_enhanced.morph IS NULL
          AND NOT ${utils.whereAramaic}
      `

      connection.query(select, (err, result) => {
        if(err) throw err

        const updates = result.map(row => `
          UPDATE words_enhanced SET morph="HC/R/Np", status='single', noguess=1 WHERE id=${row.id}
        `)

        utils.doUpdatesInChunks(connection, { updates }, numRowsUpdated => {
          console.log(`  ${numRowsUpdated} words were auto-parsed to HC/R/Np according to their BDB entry.`)
          next()
        })
            
      })

    },

    (x, next) => {

      console.log(`  טוֹב parsed HNcmsa should be HAamsa (2896 a)...`)

      const lemma = '2896 .'

      utils.runReplaceOnMorph({
        connection,
        table: 'words',
        regex: /^(H(?:[^\/]*\/)*)Nc(msa)/,
        replace: '$1Aa$2',
        doVerified: true,
        extraCondition: `lemma REGEXP '^[^0-9]*${lemma}$'`,
        next,
      })

    },
    
    (x, next) => {

      console.log(`  מים is plural, not dual (4325)...`)
      
      const lemma = '4325'

      utils.runReplaceOnMorph({
        connection,
        table: 'words',
        regex: /^(H(?:[^\/]*\/)*Ncm)d/,
        replace: '$1p',
        doVerified: true,
        extraCondition: `lemma REGEXP '^[^0-9]*${lemma}$'`,
        next,
      })

    },
    
    (x, next) => {

      console.log(`  Words marked imperatives but proceeded by אל or נא should be corrected to jussives or cohortatives...`)
      
      const select = `
        SELECT w1.*
        FROM words_enhanced as w1
          LEFT JOIN words_enhanced as w2 ON (w1.id = w2.id + 1 AND w1.number = w2.number + 1)
        WHERE w2.lemma REGEXP "(^|\/)(4994|408)$" AND w1.morph REGEXP "^H([^\/]*\/)*V[^\/]i";
      `

      connection.query(select, (err, result) => {
        if(err) throw err

        const updates = result.map(row => `
          UPDATE words_enhanced SET morph="${
            row.morph.replace(/^(H(?:[^\/]*\/)*V[^\/])i([23])/, '$1j$2').replace(/^(H(?:[^\/]*\/)*V[^\/])i1/, '$1c1')
          }" WHERE id=${row.id}
        `)

        utils.doUpdatesInChunks(connection, { updates }, numRowsUpdated => {
          console.log(`    - ${numRowsUpdated} words updated.`)
          next()
        })
            
      })
      
    },
    
    (x, next) => {

      console.log(`  Words marked imperatives but followed by נא should be corrected to jussives or cohortatives...`)
      
      const select = `
        SELECT w1.*
        FROM words_enhanced as w1
          LEFT JOIN words_enhanced as w2 ON (w1.id = w2.id - 1 AND w1.number = w2.number - 1)
        WHERE w2.lemma REGEXP "(^|\/)(4994)$" AND w1.morph REGEXP "^H([^\/]*\/)*V[^\/]i";
      `

      connection.query(select, (err, result) => {
        if(err) throw err

        const updates = result.map(row => `
          UPDATE words_enhanced SET morph="${
            row.morph.replace(/^(H(?:[^\/]*\/)*V[^\/])i([23])/, '$1j$2').replace(/^(H(?:[^\/]*\/)*V[^\/])i1/, '$1c1')
          }" WHERE id=${row.id}
        `)

        utils.doUpdatesInChunks(connection, { updates }, numRowsUpdated => {
          console.log(`    - ${numRowsUpdated} words updated.`)
          next()
        })
            
      })
      
    },
    
    (x, next) => {

      console.log(`Done with auto-parse script.`)
      done()

    },
      
  ])
}