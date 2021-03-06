require('dotenv').config()

const mysql = require('mysql')
const xml2js = require('xml2js')
const fs = require('fs')

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
                          (item.seg || []).forEach(seg => {
                            item._ += seg._
                          })
                          const specialCases = {
                            "3-11-42-3": "גָּח֜וֹן",
                            "7-18-30-10": "מְנַשֶּׁ֜ה",
                            "27-80-14-2": "מִיָּ֑עַר",
                            "29-38-13-4": "רְשָׁעִ֣ים",
                            "29-38-15-1": "מֵרְשָׁעִ֣ים",
                          }
                          if(specialCases[`${loc[0]}-${loc[1]}-${loc[2]}-${wordIndex}`]) {
                            item._ = specialCases[`${loc[0]}-${loc[1]}-${loc[2]}-${wordIndex}`]
                          }
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

    (x, next) => {

      console.log(`  Correct the lemma and word for 994...`)

      const select = `SELECT * FROM words WHERE lemma="b/994"`
  
      connection.query(select, (err, result) => {
        if(err) throw err
  
        const updates = result.map(row => {
          return `UPDATE words SET word='${row.word.replace(/\//g, '')}', lemma="994" WHERE id=${row.id}`
        })
  
        utils.doUpdatesInChunks(connection, { updates }, numRowsUpdated => {
          if(numRowsUpdated != updates.length) throw new Error(`-----------> ERROR: Not everything got updated. Just ${numRowsUpdated}/${updates.length}.`)
          console.log(`    - ${numRowsUpdated} words updated.`)
          next()
        })
  
      })
  
    },
    
    () => {
      console.log(`\nCOMPLETED\n`)
      process.exit()
    }
    
  ])
})
