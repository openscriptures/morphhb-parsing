require('dotenv').config()

const mysql = require('mysql')
var xml2js = require('xml2js')
fs = require('fs')

const utils = require('./utils')

const connection = mysql.createConnection({
  host: process.env.DB_NAME || "localhost",
  database: process.env.HOSTNAME || 'oshb',
  user: process.env.USERNAME || "root",
  password: process.env.PASSWORD || "",
  multipleStatements: true,
});

connection.connect(function(err) {
  if(err) throw err

  console.log(`\nSTARTING`)

  utils.runInSeries([
    
    (x, next) => {
      
      console.log(`  Widen word column in words table...`)
      
      const statement = `
        ALTER TABLE words MODIFY COLUMN word VARCHAR(30);
      `

      connection.query(statement, (err, result) => {
        if(err) throw err

        console.log(`    - done.`)
        next()
      })
    
    },

    (x, next) => {
      
      console.log(`  Fix words per latest morphhb data...`)

      const statement = `SELECT * FROM words ORDER BY id`

      connection.query(statement, (err, result) => {
        if(err) throw err

        const books = {}
        result.forEach(row => {
          if(books[`${row.bookId}-${row.chapter}-${row.verse}-${row.number}`]) {
            console.log('    error: identical location', row)
            process.exit()
          }
          books[`${row.bookId}-${row.chapter}-${row.verse}-${row.number}`] = row
        })

        const dirname = '../../morphhb/wlc'

        var parser = new xml2js.Parser({
          explicitChildren: true,
          preserveChildrenOrder: true,
        })

        fs.readdir(dirname, (err, filenames) => {
          if(err) { 
            console.log(err)
            process.exit()
          }              

          filenames = filenames.filter(filename => filename.match(/^\w/) && !['VerseMap.xml'].includes(filename))

          let numProcessed = 0
          let addedQadma = 0
          const updates = []

          filenames.forEach(filename => {

            fs.readFile(`${dirname}/${filename}`, 'utf-8', (err, xml) => {
              console.log(`    ${filename}...`)

              if(err) { 
                console.log(err)
                process.exit()
              }              
              
              parser.parseString(xml, function (err, result) {

                result.osis.osisText[0].div[0].chapter.forEach(chapter => {
                  
                  chapter.verse.forEach(verse => {
                    const loc = verse.$.osisID.split('.')

                    loc[0] = utils.getBibleBookIdByAbbr(loc[0])

                    let wordIndex = 0

                    verse.$$.forEach((item, index) => {

                      const conformAccents = word => word
                        .replace(/֨/g, '֙') // \u05A8 -> \u0599

                      const checkWord = (word, wordtype) => {
                        if(!books[`${loc[0]}-${loc[1]}-${loc[2]}-${wordIndex}`]) {
                          console.log(`      word loc not found: ${loc[0]}-${loc[1]}-${loc[2]}-${wordIndex} (${verse.$.osisID})`)
                          process.exit()
                        } else {
                          if(books[`${loc[0]}-${loc[1]}-${loc[2]}-${wordIndex}`].word != word._) {
                            if(books[`${loc[0]}-${loc[1]}-${loc[2]}-${wordIndex}`].word == conformAccents(word._)) {
                              addedQadma++
                            } else {
                              console.log(`      words don't match: ${books[`${loc[0]}-${loc[1]}-${loc[2]}-${wordIndex}`].word} | ${word._} (${verse.$.osisID})`)
                            }
                            updates.push(`UPDATE words SET word="${word._}" WHERE id="${books[`${loc[0]}-${loc[1]}-${loc[2]}-${wordIndex}`].id}"`)
                          }
                          if(books[`${loc[0]}-${loc[1]}-${loc[2]}-${wordIndex}`].lemma != word.$.lemma) {
                            console.log(`      lemma doesn't match: ${books[`${loc[0]}-${loc[1]}-${loc[2]}-${wordIndex}`].lemma} | ${word.$.lemma} (${verse.$.osisID})`)
                            updates.push(`UPDATE words SET lemma="${word.$.lemma}" WHERE id="${books[`${loc[0]}-${loc[1]}-${loc[2]}-${wordIndex}`].id}"`)
                          }
                          if(books[`${loc[0]}-${loc[1]}-${loc[2]}-${wordIndex}`].wordtype != wordtype) {
                            console.log(`      wordtype doesn't match: ${books[`${loc[0]}-${loc[1]}-${loc[2]}-${wordIndex}`].wordtype} | ${wordtype} (${verse.$.osisID})`)
                            updates.push(`UPDATE words SET wordtype="${wordtype}" WHERE id="${books[`${loc[0]}-${loc[1]}-${loc[2]}-${wordIndex}`].id}"`)
                          }
                        }
                        wordIndex++
                      }

                      switch(item['#name']) {
                        case 'seg': {
                          if(!books[`${loc[0]}-${loc[1]}-${loc[2]}-${wordIndex-1}`]) {
                            console.log(`      word loc not found (in seg): ${loc[0]}-${loc[1]}-${loc[2]}-${wordIndex-1} (${verse.$.osisID})`)
                            process.exit()
                          }
                          if(!['x-samekh','x-pe','x-reversednun'].includes(item.$.type)) {
                            if(books[`${loc[0]}-${loc[1]}-${loc[2]}-${wordIndex-1}`].append != item._) {
                              console.log(`      append doesn't match: ${books[`${loc[0]}-${loc[1]}-${loc[2]}-${wordIndex-1}`].append} | ${item._} (${verse.$.osisID})`)
                              updates.push(`UPDATE words SET append="${item._}" WHERE id="${books[`${loc[0]}-${loc[1]}-${loc[2]}-${wordIndex-1}`].id}"`)
                            }
                          }
                          break
                        }
                        case 'note': {
                          if(!item.$) {
                            // just ignore
                            // KJV versification info. Import this later.
                          } else if(['variant'].includes(item.$.type)) {
                            if(item.rdg.length != 1) {
                              console.log(`      bad variant: ${verse.$.osisID}`, item)
                              process.exit()
                            }
                            (item.rdg[0].w || []).forEach(w => {
                              checkWord(w, 'qere')
                            })
                          } else if(item.$.n) {
                            // text notes. just ignore for now
                          } else if(['alternative'].includes(item.$.type)) {
                            // alternative vowel pointing. ignore for now
                          } else {
                            console.log(`      unknown xml note type: ${verse.$.osisID}`, item)
                          }
                          break
                        }
                        case 'w': {
                          checkWord(item, 'word')
                          break
                        }
                        default: {
                          console.log(`      unknown xml element: ${item['#name']} (${verse.$.osisID})`)
                          process.exit()
                        }
                      }

                    })

                  })
                })

                if(++numProcessed >= filenames.length) {
                  utils.doUpdatesInChunks(connection, { updates }, numRowsUpdated => {
                    console.log(`    - MorphHB changed QADMA to PASHTA in ${addedQadma} words (not listed above)`)
                    console.log(`    - ${numRowsUpdated} words updated`)
                    console.log(`    - done.`)
                    next()                
                  })
                }
              })
            })
          })
        })
      })
      
    },

    // (x, next) => {
      
    //   console.log(`  Fix words where they were cut-off or incorrect...`)

    //   const statement = `
    //     UPDATE words SET wordtype="qere" WHERE bookId=13 AND chapter=6 AND verse=29 AND number=4;
    //   `

    //   connection.query(statement, (err, result) => {
    //     if(err) throw err

    //     console.log(`    - done.`)
    //     next()
    //   })
    
    // },

    // (x, next) => {
      
    //   console.log(`  Divide words where they should have been divided...`)

    //   const updates = []
    //   ;[
    //     [1,14,17,8,"כְּדָר","לָעֹ֔מֶר","3540"],
    //   ].forEach(updateInfo => {
    //     updates.push(`UPDATE words SET number=number+1 WHERE bookId=${updateInfo[0]} AND chapter=${updateInfo[1]} AND verse=${updateInfo[2]} AND number>${updateInfo[3]}`)
    //     updates.push(`UPDATE words SET word="${updateInfo[4]}" WHERE bookId=${updateInfo[0]} AND chapter=${updateInfo[1]} AND verse=${updateInfo[2]} AND number=${updateInfo[3]}`)
    //     updates.push(`
    //       INSERT INTO words
    //         (bookId, chapter, verse, number, word, lemma, wordtype, status)
    //         VALUES ("${updateInfo[0]}", "${updateInfo[1]}", "${updateInfo[2]}", "${updateInfo[3]+1}", "${updateInfo[5]}", "${updateInfo[6]}", "word", "none")
    //     `)
    //   })
      
    //   utils.doUpdatesInChunks(connection, { updates }, numRowsUpdated => {
    //     console.log(`    - done.`)
    //     next()                
    //   })
              
    // },

    // (x, next) => {
      
    //   console.log(`  Reindexing...`)

    //   const statement = `
    //     DROP TABLE IF EXISTS words_temp; 
    //     CREATE TABLE words_temp LIKE words;
    //     INSERT words_temp
    //       SELECT
    //         NULL as id,
    //         bookId,
    //         chapter,
    //         verse,
    //         number,
    //         word,
    //         append,
    //         lemma,
    //         morph,
    //         wordtype,
    //         status
    //       FROM words
    //       ORDER BY bookId, chapter, verse, number;
    //     DROP TABLE IF EXISTS words; 
    //     RENAME TABLE words_temp TO words;
    //   `

    //   connection.query(statement, (err, result) => {
    //     if(err) throw err

    //     console.log(`    - done.`)
    //     next()
    //   })

    // },

    () => {
      console.log(`\nCOMPLETED\n`)
      process.exit()
    }
    
  ])
})
