const utils = require('../utils')

module.exports = (connection, done) => {
  
  console.log(`\nRunning verified-report script...`)

  const select = `
    SELECT
      bookId,
      COUNT(bookId) as cnt
    FROM
      words_enhanced
    WHERE
      status NOT LIKE "verified"
    GROUP BY 
      bookId
    ORDER BY
      cnt
  `

  connection.query(select, (err, result) => {
    if(err) throw err

    result.forEach(row => {
      console.log(`  ${utils.getBibleBookName(row.bookId)} (${row.cnt} words need to be verified)`)
    })

    console.log(`Done with verified-report script.`)
    done()
  })
  
}  