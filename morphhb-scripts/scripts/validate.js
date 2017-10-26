const utils = require('../utils')

// change status of words_enhanced rows based upon etcbc

module.exports = (connection, done) => {
  
  console.log(`\nRunning validate script...`)

  utils.runInSeries([

    (x, next) => {
      
      console.log(`  Go through each word, setting status to confirmed if etcbc matches, reducing status if not...`)

      const statement = `
        SELECT
          words_enhanced.*, etcbc_enhanced.morph as etcbcMorph
        FROM words_enhanced
          LEFT JOIN etcbc_enhanced ON (etcbc_enhanced.id = words_enhanced.id)
        WHERE 
          words_enhanced.morph IS NOT NULL
          AND etcbc_enhanced.morph IS NOT NULL
      `

      connection.query(statement, (err, result) => {
        if(err) throw err
        
        const updates = []
        let mismatchedVerifieds = {}
                
        result.forEach(row => {

          const compareResult = utils.compareWithETCBC({ row })

          if(compareResult == "unknown") return

          let newStatus = row.status

          if(row.morph == row.etcbcMorph) {
            newStatus = "verified"
          } else if(compareResult == "match") {
            newStatus = row.status == "verified" ? "verified" : "confirmed"
          } else if(row.status == "single") {
            newStatus = "conflict"
          } else if(row.status == "confirmed") {
            newStatus = "single"
          } else if(row.status == "verified") {
            newStatus = "confirmed"
            if(!mismatchedVerifieds[row.accentlessword]) {
              mismatchedVerifieds[row.accentlessword] = {
                accentlessword: row.accentlessword,
                morph: row.morph,
                etcbcMorph: row.etcbcMorph,
                num: 0,
              }
            }
            mismatchedVerifieds[row.accentlessword].num++
          }

          if(row.status != newStatus) {
            updates.push(`UPDATE words_enhanced SET status="${newStatus}" WHERE id=${row.id}`)
          }
          
        })

        mismatchedVerifieds = Object.values(mismatchedVerifieds)
        mismatchedVerifieds.sort((a,b) => (a.num > b.num ? 1 : -1))
        mismatchedVerifieds.forEach(mismatchedWord => {
          console.log(`    ${mismatchedWord.accentlessword} ${mismatchedWord.morph} ${mismatchedWord.etcbcMorph} (${mismatchedWord.num}x were verified by didn't match)`)
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