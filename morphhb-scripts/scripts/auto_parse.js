const utils = require('../utils')

module.exports = (connection, done) => {
  
  console.log(`\nRunning auto-parse script...`)

  // Updates the words_enhanced table [and eventually will also insert into the notes and wordnote table with memberid=416]
  // according to pre-determined parsing for common forms

  utils.runInSeries([

    (x, next) => {

      const updates = []

      for(let form in autoParseForms) {
        updates.push(`
          UPDATE words_enhanced SET morph='${autoParseForms[form]}', status='single'
            WHERE 
              accentlessword='${form}'
              AND status NOT IN('confirmed', 'verified')
              AND NOT ${utils.whereAramaic}
        `)
      }

      for(let form in superAutoParseForms) {
        updates.push(`
          UPDATE words_enhanced SET morph='${superAutoParseForms[form]}', status='single'
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
          UPDATE words_enhanced SET morph="HNp" WHERE id=${row.id}
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
          UPDATE words_enhanced SET morph="HC/Np" WHERE id=${row.id}
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
          LEFT JOIN bdb ON (words_enhanced.lemma=CONCAT('l/', bdb.id))
        WHERE
          bdb.pos LIKE "n-pr%"
          AND words_enhanced.morph IS NULL
          AND NOT ${utils.whereAramaic}
      `

      connection.query(select, (err, result) => {
        if(err) throw err

        const updates = result.map(row => `
          UPDATE words_enhanced SET morph="HR/Np" WHERE id=${row.id}
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
          LEFT JOIN bdb ON (words_enhanced.lemma=CONCAT('b/', bdb.id))
        WHERE
          bdb.pos LIKE "n-pr%"
          AND words_enhanced.morph IS NULL
          AND NOT ${utils.whereAramaic}
      `

      connection.query(select, (err, result) => {
        if(err) throw err

        const updates = result.map(row => `
          UPDATE words_enhanced SET morph="HR/Np" WHERE id=${row.id}
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
          LEFT JOIN bdb ON (words_enhanced.lemma=CONCAT('m/', bdb.id))
        WHERE
          bdb.pos LIKE "n-pr%"
          AND words_enhanced.morph IS NULL
          AND NOT ${utils.whereAramaic}
      `

      connection.query(select, (err, result) => {
        if(err) throw err

        const updates = result.map(row => `
          UPDATE words_enhanced SET morph="HR/Np" WHERE id=${row.id}
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
          LEFT JOIN bdb ON (words_enhanced.lemma=CONCAT('k/', bdb.id))
        WHERE
          bdb.pos LIKE "n-pr%"
          AND words_enhanced.morph IS NULL
          AND NOT ${utils.whereAramaic}
      `

      connection.query(select, (err, result) => {
        if(err) throw err

        const updates = result.map(row => `
          UPDATE words_enhanced SET morph="HR/Np" WHERE id=${row.id}
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
          LEFT JOIN bdb ON (words_enhanced.lemma=CONCAT('d/', bdb.id))
        WHERE
          bdb.pos LIKE "n-pr%"
          AND words_enhanced.morph IS NULL
          AND NOT ${utils.whereAramaic}
      `

      connection.query(select, (err, result) => {
        if(err) throw err

        const updates = result.map(row => `
          UPDATE words_enhanced SET morph="HTd/Np" WHERE id=${row.id}
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
          LEFT JOIN bdb ON (words_enhanced.lemma=CONCAT('c/l/', bdb.id))
        WHERE
          bdb.pos LIKE "n-pr%"
          AND words_enhanced.morph IS NULL
          AND NOT ${utils.whereAramaic}
      `

      connection.query(select, (err, result) => {
        if(err) throw err

        const updates = result.map(row => `
          UPDATE words_enhanced SET morph="HC/R/Np" WHERE id=${row.id}
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
          LEFT JOIN bdb ON (words_enhanced.lemma=CONCAT('c/b/', bdb.id))
        WHERE
          bdb.pos LIKE "n-pr%"
          AND words_enhanced.morph IS NULL
          AND NOT ${utils.whereAramaic}
      `

      connection.query(select, (err, result) => {
        if(err) throw err

        const updates = result.map(row => `
          UPDATE words_enhanced SET morph="HC/R/Np" WHERE id=${row.id}
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
          LEFT JOIN bdb ON (words_enhanced.lemma=CONCAT('c/m/', bdb.id))
        WHERE
          bdb.pos LIKE "n-pr%"
          AND words_enhanced.morph IS NULL
          AND NOT ${utils.whereAramaic}
      `

      connection.query(select, (err, result) => {
        if(err) throw err

        const updates = result.map(row => `
          UPDATE words_enhanced SET morph="HC/R/Np" WHERE id=${row.id}
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
          LEFT JOIN bdb ON (words_enhanced.lemma=CONCAT('c/k/', bdb.id))
        WHERE
          bdb.pos LIKE "n-pr%"
          AND words_enhanced.morph IS NULL
          AND NOT ${utils.whereAramaic}
      `

      connection.query(select, (err, result) => {
        if(err) throw err

        const updates = result.map(row => `
          UPDATE words_enhanced SET morph="HC/R/Np" WHERE id=${row.id}
        `)

        utils.doUpdatesInChunks(connection, { updates }, numRowsUpdated => {
          console.log(`  ${numRowsUpdated} words were auto-parsed to HNp according to their BDB entry.`)
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

      console.log(`Done with auto-parse script.`)
      done()

    },
      
  ])
}

const autoParseForms = {

  // Prototypical Uses of Particles
  // http://ug-info.readthedocs.io/en/latest/hebrew.html
  "כִּי": "HC",
  "אִם": "HC",
  "אוֹ": "HC",
  "גַּם": "HTa",
  "אַף": "HTa",
  "רַק": "HTa",
  "אַךְ": "HTa",
  "עַתָּה": "HD",
  "וְעַתָּה": "HC",
  "פֶּן": "HC",
  "לוּ": "HC",
  "נָא": "HTe",
  "אָנָּא": "HTe",
  "בִּי": "HTe",
  "הָהּ": "HTj",
  "הוֹ": "HTj",
  "הֶאָח": "HTj",
  "אִי": "HTj",
  "הִנֵּה": "HTm",
  "הֵן": "HTm",
  "כֵּן": "HTm",
  "לֹא": "HTn",
  "אַל": "HTn",
  "אַיִן": "HTn",
  "בַּל": "HTn",
  "בְּלִי": "HTn",
  "בִּלְתִּי": "HC",
  "אָנָה": "HD",
  "פֹּה": "HD",
  "כֹּה": "HD",
  "אַי": "HD",
  "וְ/אִם": "HC/C",
  "וְ/גַם": "HC/Ta",
  "וְ/רַק": "HC/Ta",
  "וְ/הִנֵּה": "HC/Tm",
  "וְ/כֵן": "HC/Tm",
  "וְ/לֹא": "HC/Tn",
  "וְ/אַל": "HC/Tn",
  "וְ/אֵין": "HC/Tn",
  "וּֽ/בַל": "HC/Tn",
  "וְ/אָנוּ": "HC/D",
  "וְ/כֹֽה": "HC/D",

  // Demonstrative pronouns
  "זֶה": "HPdxms",
  "וְ/זֶה": "HC/Pdxms",
  "מִ/זֶּה": "HR/Pdxms",
  "בָ/זֶה": "HR/Pdxms",
  "הַ/זֶּה": "HTd/Pdxms",
  "זֹו": "HPdxms",
  "זֹה": "HPdxms",
  "זֹאת": "HPdxfs",
  "וְ/זֹאת": "HC/Pdxfs",
  "בְּ/זֹאת": "HR/Pdxfs",
  "הַ/זֹּאת": "HTd/Pdxfs",
  "הַ/הוּא": "HTd/Pdxms",
  "הַ/הִוא": "HTd/Pdxfs",
  "הַ/הִיא": "HTd/Pdxfs",
  "אֵלֶּה": "HPdxcp",
  "וְ/אֵלֶּה": "HC/Pdxcp",
  "בְּ/אֵלֶּה": "HR/Pdxcp",
  "מֵ/אֵלֶּה": "HR/Pdxcp",
  "לָ/אֵלֶּה": "HR/Pdxcp",
  "הָ/אֵלֶּה": "HTd/Pdxcp",
  "הָ/הֵם": "HTd/Pdxcp",
  "הָ/הֵמָּה": "HTd/Pdxcp",

  // Fixes to common mis-parsed words
  "אֲדֹנָי/ו": "HNcmpc/Sp3ms",
  "אַחֲרֵי": "HR",
  "וְ/אַחֲרֵי": "HC/R",
  "פְּלִשְׁתִּים": "HNgmpa",
  "לָ/כֶם": "HR/Sp2mp",
  "יְשַׁלֵּם": "HVpi3ms",
  "וַ/יַּעֲלוּ": "HC/Vqw3mp",
  "מֵ/אֵת": "HR/R",
  "בְּ/תוֹךְ": "HR/Ncmsc",
  "בַּ/מִּדְבָּר": "HRd/Ncmsa",
  "שָׁמַיִם": "HNcmpa",
  "שְׁנֵי/הֶם": "HAcmpc/Sp3mp",
  "הָ/רִאשׁוֹן": "HTd/Aomsa",
  "וַ/אֲשֶׁר": "HC/Tr",
  "לָא": "HTn",
  "לוֹא": "HTn",
  "אֵי": "HTi",
  "מָחָר": "HNcmsa",
  "כָּל": "HNcmsc",
  "וְ/כָל": "HC/Ncmsc",
  "וַ/יֹּאמֶר": "HC/Vqw3mp",
  "בְּ/כָל": "HR/Ncmsc",
  "כָל": "HNcmsc",
  "וְ/עַד": "HC/R",
  "לְ/כָל": "HR/Ncmsc",
  "יַעַן": "HC",
  "בְנ/וֹ": "HNcmsc/Sp3ms",
  "בְּ/עֵינֵי": "HR/Ncfdc",
  
  "לְ/פָנֵי/נוּ": "HR/Ncmpc/Sp1cp",
  "מִ/לְּ/פָנֵ/נוּ": "HR/R/Ncmpc/Sp1cp",
  "מִ/פָּנֵי/נוּ": "HR/Ncmpc/Sp1cp",
  "פָּנֵי/נוּ": "HNcmpc/Sp1cp",
  "פָּנַיִ/ךְ": "HNcmpc/Sp2fs",
  "פָנֵי/מוֹ": "HNcmpc/Sp3ms",
}

const superAutoParseForms = {
  // These will even correct verified parsings

  "בַּ/יּוֹם": "HRd/Ncmsa",
  "וּ/בַ/לַּיְלָה": "HC/Rd/Ncmsa",
  "לָ/כֶם": "HR/Sp2mp",
  "וַ/יֹּאמֶר": "HC/Vqw3ms",
  "לַ/מְנַצֵּחַ": "HRd/Vprmsa",
  "בְּנִ/י": "HNcmsc/Sp1cs",
  "לְ/ךָ": "HR/Sp2ms",
  "יִשְׁמְעֵאלִים": "HNgmpa",
  "וְ/יִשְׁמְעֵאלִים": "HC/Ngmpa",

  // מַעְלָ/ה is always D/Sd (per Joel via Slack)
  "מַעְלָ/ה": "HD/Sd",
  "וָ/מַעְלָ/ה": "HC/D/Sd",
  "וּ/לְ/מַעְלָ/ה": "HC/R/D/Sd",
  "וּ/מִ/לְ/מַעְלָ/ה": "HC/R/R/D/Sd",
  "לְ/מַעְלָ/ה": "HR/D/Sd",
  "מִ/לְ/מַעְלָ/ה": "HR/R/D/Sd",

  // טֶרֶם  is always an adverb (per Joel via Slack)
  "טֶרֶם": "HD",
  "בְּ/טֶרֶם": "HR/D",
  "הֲ/טֶרֶם": "HTd/D",
  "וְ/טֶרֶם": "HC/D",
  "וּ/בְ/טֶרֶם": "HC/R/D",

  "לָ/מֶה": "HTi",
  "לָ/כֵן": "HR/D",
  "מַדּוּעַ": "HTi",
  "אָמֵן": "HD",
  "שְׁאוֹל": "HNp",
  "אַשְׁרֵי": "HNcmpa",
  "שִׁלְשׁוֹם": "HNcmsa",

  "בְּ/פָנִים": "HR/Ncmpa",
  "בְּ/פָנֶי/הָ": "HR/Ncmpc/Sp3fs",
  "בְּ/פָנֶי/ךָ": "HR/Ncmpc/Sp2ms",
  "בְּ/פָנַ/י": "HR/Ncmpc/Sp1cs",
  "בְּ/פָנָי/ו": "HR/Ncmpc/Sp3ms",
  "בִּ/פְנֵי": "HR/Ncmpc",
  "בִּ/פְנֵי/הֶם": "HR/Ncmpc/Sp3mp",
  "בִּ/פְנֵי/כֶם": "HR/Ncmpc/Sp2mp",
  "הַ/פָּנִים": "HTd/Ncmpa",
  "ו/פני": "HC/Ncmpc",
  "וְ/לִ/פְנֵי": "HC/R/Ncmpc",
  "וְ/לִ/פְנֵי/הֶם": "HC/R/Ncmpc/Sp3mp",
  "וּ/לְ/פָנֶי/ךָ": "HC/R/Ncmpc/Sp2ms",
  "וּ/לְ/פָנָי/ו": "HC/R/Ncmpc/Sp3ms",
  "וּ/מִ/לְּ/פָנִים": "HC/R/R/Ncmpa",
  "וּ/מִ/לִּ/פְנֵי": "HC/R/R/Ncmpc",
  "וּ/מִ/פְּנֵי": "HC/R/Ncmpc",
  "וּ/מִ/פְּנֵי/הֶם": "HC/R/Ncmpc/Sp3mp",
  "וּ/מִ/פָּנֶי/ךָ": "HC/R/Ncmpc/Sp2ms",
  "וּ/מִ/פָּנַ/י": "HC/R/Ncmpc/Sp1cs",
  "וּ/פְנֵי": "HC/Ncmpc",
  "וּ/פְנֵי/הֶם": "HC/Ncmpc/Sp3mp",
  "וּ/פָנִים": "HC/Ncmpa",
  "וּ/פָנֶי/הָ": "HC/Ncmpc/Sp3fs",
  "וּ/פָנֶי/ךָ": "HC/Ncmpc/Sp2ms",
  "וּ/פָנַ/י": "HC/Ncmpc/Sp1cs",
  "וּ/פָנָי/ו": "HC/Ncmpc/Sp3ms",
  "כְּ/מִ/פְּנֵי": "HR/R/Ncmpc",
  "לְ/פָנִים": "HR/Ncmpa",
  "לְ/פָנֶי/הָ": "HR/Ncmpc/Sp3fs",
  "לְ/פָנֶי/ךָ": "HR/Ncmpc/Sp2ms",
  "לְ/פָנַ/י": "HR/Ncmpc/Sp1cs",
  "לְ/פָנָ/י": "HR/Ncmpc/Sp1cs",
  "לְ/פָנָי/ו": "HR/Ncmpc/Sp3ms",
  "לִ/פְנֵי": "HR/Ncmpc",
  "לִ/פְנֵי/הֶם": "HR/Ncmpc/Sp3mp",
  "לִ/פְנֵי/כֶם": "HR/Ncmpc/Sp2mp",
  "לַ/פָּנִים": "HR/Ncmpa",
  "מִ/לְּ/פָנֶי/ךָ": "HR/R/Ncmpc/Sp2ms",
  "מִ/לְּ/פָנַ/י": "HR/R/Ncmpc/Sp1cs",
  "מִ/לְּ/פָנָ/י": "HR/R/Ncmpc/Sp1cs",
  "מִ/לְּ/פָנָי/ו": "HR/R/Ncmpc/Sp3ms",
  "מִ/לִּ/פְנִים": "HR/R/Ncmpa",
  "מִ/לִּ/פְנֵי": "HR/R/Ncmpc",
  "מִ/לִּ/פְנֵי/כֶם": "HR/R/Ncmpc/Sp2mp",
  "מִ/פְּנֵי": "HR/Ncmpc",
  "מִ/פְּנֵי/הֶם": "HR/Ncmpc/Sp3mp",
  "מִ/פְּנֵי/כֶם": "HR/Ncmpc/Sp2mp",
  "מִ/פָּנִים": "HR/Ncmpa",
  "מִ/פָּנֶי/ה": "HR/Ncmpc/Sp3fs",
  "מִ/פָּנֶי/הָ": "HR/Ncmpc/Sp3fs",
  "מִ/פָּנֶי/ךָ": "HR/Ncmpc/Sp2ms",
  "מִ/פָּנַ/י": "HR/Ncmpc/Sp1cs",
  "מִ/פָּנָ/י": "HR/Ncmpc/Sp1cs",
  "מִ/פָּנָי/ו": "HR/Ncmpc/Sp3ms",
  "פְנֵי": "HNcmpc",
  "פְנֵי/הֶם": "HNcmpc/Sp3mp",
  "פְנֵי/כֶם": "HNcmpc/Sp2mp",
  "פָנִים": "HNcmpa",
  "פָנֶי/הָ": "HNcmpc/Sp3fs",
  "פָנֶי/ךָ": "HNcmpc/Sp2ms",
  "פָנַ/י": "HNcmpc/Sp1cs",
  "פָנָ/י": "HNcmpc/Sp1cs",
  "פָנָי/ו": "HNcmpc/Sp3ms",
  "פְּנֵי": "HNcmpc",
  "פְּנֵי/הֶם": "HNcmpc/Sp3mp",
  "פְּנֵי/כֶם": "HNcmpc/Sp2mp",
  "פָּנִים": "HNcmpa",
  "פָּנֶי/הָ": "HNcmpc/Sp3fs",
  "פָּנֶי/ךָ": "HNcmpc/Sp3ms",
  "פָּנַ/י": "HNcmpc/Sp1cs",
  "פָּנָ/י": "HNcmpc/Sp1cs",
  "פָּנָ/יַ": "HNcmpc/Sp1cs",
  "פָּנָי/ו": "HNcmpc/Sp3ms",
}