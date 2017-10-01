const indexes = [
  {
    col: 'morph',
    table: 'words',
  },
  {
    col: 'word',
    table: 'words',
  },
]

module.exports = {

  createIndexes: (connection, done) => {

    let createIndexStatements = ``

    indexes.forEach(indexInfo => {
      createIndexStatements += `
        CREATE INDEX ${indexInfo.col}_index ON ${indexInfo.table}_enhanced (${indexInfo.col});
      `
    })

    connection.query(createIndexStatements, (err, result) => {
      if(err) throw err
      
      done()
    })

  },

  dropIndexes: (connection, done) => {

    let dropIndexStatements = ``

    indexes.forEach(indexInfo => {
      dropIndexStatements += `
        DROP INDEX ${indexInfo.col}_index ON ${indexInfo.table}_enhanced;
      `
    })

    connection.query(dropIndexStatements, (err, result) => {
      if(err) throw err
      
      done()
    })

  },


}
  