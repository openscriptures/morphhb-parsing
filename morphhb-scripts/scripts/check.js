const utils = require('../utils')

// flag notes_enhanced entries that do not match. then, preference away from those in the compare script

module.exports = (connection, done) => {
  
  console.log(`\nRunning check script...`)

  utils.runInSeries([

    (x, next) => {
      
      console.log(`  Add the etcbcnomatch column...`)
      utils.addColumn(connection, {
        table: 'notes',
        col: 'etcbcnomatch',
        colDef: 'TINYINT(1)',
        afterCol: 'verification',
      }, next)  
    },

    (x, next) => {
      
      console.log(`  Flag notes_enhanced entries that do not match...`)

      const statement = `
        SELECT notes_enhanced.id, notes_enhanced.morph, etcbc_enhanced.morph as etcbcMorph, words_enhanced.accentlessword, words_enhanced.bookId, words_enhanced.chapter, words_enhanced.verse, words_enhanced.lemma
        FROM notes_enhanced
          LEFT JOIN wordnote_enhanced ON (wordnote_enhanced.noteId = notes_enhanced.id)
          LEFT JOIN words_enhanced ON (wordnote_enhanced.wordId = words_enhanced.id)
          LEFT JOIN etcbc_enhanced ON (etcbc_enhanced.id = words_enhanced.id)
        WHERE
          etcbc_enhanced.morph != notes_enhanced.morph
      `

      connection.query(statement, (err, result) => {
        if(err) throw err
        
        const updates = []
        let mismatchedWords = {}
        let num = 0

        result.forEach(row => {

          let morph = row.morph
          let etcbcMorph = row.etcbcMorph

          if(morph.match(/^(H(?:[^\/]*\/)*[^\/]+)\/Sp[123][mfc][sp]/)) {
            etcbcMorph = etcbcMorph
              .replace(/^(H(?:[^\/]*\/)*(?:N[^\/][^\/][^\/]|A[^\/][^\/][^\/]|V[^\/][rs][^\/][^\/]))a/, '$1c')  // etcbc does not mark words with a pronominal suffix as construct
          }
          
          if(row.lemma.match(/(^|\/)6440$/)) {
            etcbcMorph = etcbcMorph
              .replace(/^(H(?:[^\/]*\/)*Nc)m([^\/][^\/])/, '$1b$2')  // etcbc marks פנים as masc
          }

          if(morph.match(/^(H(?:[^\/]*\/)*)Ac/)) {
            // cardinal numbers not indicated in etcbc
            // etcbc marks gender on numbers differently
            etcbcMorph = etcbcMorph
              .replace(/^(H(?:[^\/]*\/)*)Nc[bmf]/, '$1Ncx')  
            morph = morph
              .replace(/^(H(?:[^\/]*\/)*)Ac[bmf]/, '$1Ncx')  
          }

          morph = morph
            .replace(/^(A(?:[^\/]*\/)*)Td/, '$1')  // definite article for Aramaic not indicated in etcbc
            .replace(/^(H(?:[^\/]*\/)*)Ao/, '$1Aa')  // ordinal numbers not indicated in etcbc
            .replace(/^(H(?:[^\/]*\/)*[^\/]+)\/S[^\/]+$/, '$1')  // suffixes not indicated in etcbc
            .replace(/^(H(?:[^\/]*\/)*)Ng([^\/][^\/][^\/])/, '$1Aa$2')  // gentilic nouns not indicated in etcbc
            .replace(/^(H(?:[^\/]*\/)*V[^\/])q/, '$1p')  // etcbc doesn't use WeQatal verb stem


          if(etcbcMorph.match(/^(H(?:[^\/]*\/)*N[^\/])b/)) {
            morph = morph
              .replace(/^(H(?:[^\/]*\/)*N[^\/])[mf]/, '$1b')  // ignore gender when etcbc marks it both (since we might specify gender per context)
          }

          if(row.accentlessword.match(/נֶגֶד/)) return  // etcbc marks this HNcmsc
          if(row.accentlessword.match(/אַחֲרֵי/)) return  // etcbc marks this HNcmpc
          if(row.accentlessword.match(/תַּחַת/)) return  // etcbc marks this HNcmsc
          if(row.accentlessword.match(/מְאֹד/)) return  // etcbc marks this HNcmsa
          if(row.accentlessword.match(/מַיִם/)) return  // etcbc marks this HNcmpa (i.e. not dual)
          if(row.accentlessword.match(/(בֵּין|וּ\/בֵ)/)) return  // etcbc marks this HNcmsc
          if(row.accentlessword.match(/סָבִיב/)) return  // etcbc marks this HNcbsa
          if(row.accentlessword.match(/עוֹד/)) return  // etcbc marks this HNcmsa
          if(row.accentlessword.match(/אֲדֹנָ\/י/)) return  // etcbc marks this HNp
          if(row.accentlessword.match(/הִנֵּה/)) return  // etcbc marks this HTj
          if(row.accentlessword.match(/(לָ\/מָה|לָ\/מָּה)/)) return  // etcbc marks this as single unit
          if(row.accentlessword.match(/(אַיִן|אֵין)/)) return  // etcbc marks this as a noun

          if(morph == etcbcMorph) return

          updates.push(`UPDATE notes_enhanced SET etcbcnomatch=1 WHERE id=${row.id}`)

          if(!mismatchedWords[row.accentlessword]) {
            mismatchedWords[row.accentlessword] = {
              accentlessword: row.accentlessword,
              morph: row.morph,
              etcbcMorph: row.etcbcMorph,
              num: 0,
            }
          }
          mismatchedWords[row.accentlessword].num++
        })

        mismatchedWords = Object.values(mismatchedWords)
        mismatchedWords.sort((a,b) => (a.num > b.num ? 1 : -1))
        mismatchedWords.forEach(mismatchedWord => {
          if(mismatchedWord.num >= 5) {
            console.log(`    ${mismatchedWord.accentlessword} ${mismatchedWord.morph} ${mismatchedWord.etcbcMorph} (${mismatchedWord.num}x)`)
          }
        })

        utils.doUpdatesInChunks(connection, { updates }, numRowsUpdated => {
          if(numRowsUpdated != updates.length) throw new Error(`-----------> ERROR: Not everything got updated. Just ${numRowsUpdated}/${updates.length}.`)
          console.log(`    - ${updates.length} entries flagged.`)
          next()                
        })
              
      })
          
    },

    () => {
      console.log(`Done with check script.`)
      done()
    }
  ])
    
}  