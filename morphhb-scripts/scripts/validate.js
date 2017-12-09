const utils = require('../utils')

// change status of words_enhanced rows based upon etcbc

module.exports = (connection, done) => {
  
  console.log(`\nRunning validate script...`)

  utils.runInSeries([

    (x, next) => {
      
      console.log(`  Go through each word, setting status to confirmed if etcbc matches, reducing status if not...`)

      const statement = `
        SELECT
          words_enhanced.*, etcbc_enhanced.morph as etcbcMorph, notes_enhanced.id as humanNotesId
        FROM words_enhanced
          LEFT JOIN etcbc_enhanced ON (etcbc_enhanced.id = words_enhanced.id)
          LEFT JOIN wordnote_enhanced ON (wordnote_enhanced.wordId = words_enhanced.id)
          LEFT JOIN notes_enhanced ON (wordnote_enhanced.noteId = notes_enhanced.id AND words_enhanced.morph = notes_enhanced.morph AND notes_enhanced.memberId != 416)
        ORDER BY 
          words_enhanced.id
      `

      connection.query(statement, (err, result) => {
        if(err) throw err
        
        const updates = []
        let mismatchedVerifieds = {}
        
        let humanCreatedThisMorph = false

        result.forEach((row, rowIndex) => {

          if(!row.morph) return

          humanCreatedThisMorph = humanCreatedThisMorph || !!row.humanNotesId
          if(result[rowIndex+1] && result[rowIndex+1].id == row.id) return

          const compareResult = utils.compareWithETCBC({ row, skipAddl: true })

          if(compareResult == "unknown") {
            humanCreatedThisMorph = false
            return
          }

          let newStatus = row.status

          if(compareResult == "match") {
            newStatus = "verified"
          } else if(compareResult == "imperfect match") {
            if(row.status == "verified") {
              newStatus = "verified"
            } else if(row.morph.match(/^H(?:[^\/]*\/)*V[^\/][hj]/) && (
              (result[rowIndex-1] || "").lemma.match(/(?:^|\/)(?:4994|408)$/)
              || (result[rowIndex+1] || "").lemma.match(/(?:^|\/)(?:4994)$/)
            )) {
              // verify words that can be discerned as jussives/cohortatives from the context
              newStatus = "verified"
            } else if(row.morph.match(/^H(?:[^\/]*\/)*V[^\/]i/) && (
              (result[rowIndex-1] || "").lemma.match(/(?:^|\/)(?:3808|1077)$/)
            )) {
              // verify words that can be discerned as imperfects from the context
              newStatus = "verified"
            } else if(humanCreatedThisMorph) {
              // verify those which were parsed by humans
              newStatus = "verified"
            } else {
              newStatus = "confirmed"
            }
          } else if(compareResult == "vav-perfect match") {
            if(row.status == "verified") {
              newStatus = "verified"
            } else if(humanCreatedThisMorph) {
              // verify those which were parsed by humans
              newStatus = "verified"
            } else {
              newStatus = "confirmed"
            }
          } else if(compareResult == "unverified match") {
            newStatus = row.status == "verified" ? "verified" : "confirmed"
          } else if(row.status == "single") {
            newStatus = "conflict"
          } else if(row.status == "confirmed") {
            newStatus = "single"
          } else if(row.status == "verified") {
            if(!mismatchedVerifieds[row.accentlessword]) {
              mismatchedVerifieds[row.accentlessword] = {
                accentlessword: row.accentlessword,
                morph: row.morph,
                etcbcMorph: row.etcbcMorph || "",
                num: 0,
              }
            }
            mismatchedVerifieds[row.accentlessword].num++
          }

          if(row.status != newStatus) {
            updates.push(`UPDATE words_enhanced SET status="${newStatus}" WHERE id=${row.id}`)
          }
          
          humanCreatedThisMorph = false

        })

        mismatchedVerifieds = Object.values(mismatchedVerifieds)
        mismatchedVerifieds.sort((a,b) => (a.num > b.num ? 1 : -1))
        mismatchedVerifieds.forEach(mismatchedWord => {
          console.log(`    ${mismatchedWord.accentlessword} ${mismatchedWord.morph} ${mismatchedWord.etcbcMorph} (${mismatchedWord.num}x is verified but doesn't match)`)
        })

        utils.doUpdatesInChunks(connection, { updates }, numRowsUpdated => {
          if(numRowsUpdated != updates.length) throw new Error(`-----------> ERROR: Not everything got updated. Just ${numRowsUpdated}/${updates.length}.`)
          console.log(`    - ${updates.length} words had their status updated.`)
          next()                
        })
              
      })
          
    },

    () => {
      console.log(`Done with validate script.`)
      done()
    }
  ])
    
}  