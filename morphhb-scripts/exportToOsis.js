require('dotenv').config()

const mysql = require('mysql')
const xml2js = require('xml2js')
const js2xmlparser = require("js2xmlparser")
const fs = require('fs')
const shell = require('shelljs')

const utils = require('./utils')

const connection = mysql.createConnection({
  host: process.env.DB_NAME || "localhost",
  database: process.env.HOSTNAME || 'oshb',
  user: process.env.USERNAME || "root",
  password: process.env.PASSWORD || "",
  multipleStatements: true,
})

const todayDate = new Date()
const today = `${todayDate.getFullYear()}.${todayDate.getMonth() + 1}.${todayDate.getDate()}`

connection.connect(function(err) {
  if(err) throw err

  console.log(`\nSTARTING`)

  const bookURIsByBookId = {}
  const importDir = '../../morphhb/wlc'
  const exportDir = "./morphhb"

  utils.runInSeries([
    
    // (x, next) => {

    //   var parser = new xml2js.Parser({
    //     explicitChildren: true,
    //     preserveChildrenOrder: true,
    //     attrkey: '@',
    //   })

    //   const dirname = '../../morphhb/wlc'
    //   const filename = `Obad.xml`

    //   fs.readFile(`${dirname}/${filename}`, 'utf-8', (err, xml) => {
    //     console.log(`    ${filename}...`)

    //     if(err) { 
    //       console.log(err)
    //       process.exit()
    //     }              
              
    //     parser.parseString(xml, function (err, result) {

    //       console.log(JSON.stringify(result))

    //       process.exit()
          
    //     })
    //   })

    // },

    (x, next) => {

      fs.readdir(importDir, (err, filenames) => {
        if(err) { 
          console.log(err)
          process.exit()
        }              

        filenames = filenames.filter(filename => filename.match(/^\w/) && !['VerseMap.xml'].includes(filename))

        filenames.forEach(filename => {
          const bookId = utils.getBibleBookIdByAbbr(filename.replace(/\..*$/, ''))
          bookURIsByBookId[bookId] = filename
        })

        next()
        
      })

    },

    (x, next) => {

      const parser = new xml2js.Parser({
        explicitChildren: true,
        preserveChildrenOrder: true,
      })

      let bookId = 1

      const exportBook = () => {

        if(bookId > 39) {

          next()
          return
        }

        const statement = `SELECT * FROM words WHERE bookId=${bookId} ORDER BY id`

        connection.query(statement, (err, result) => {
          if(err) throw err

          const contributorsStatement = `
            SELECT DISTINCT members.firstName, members.lastName, members.role
            FROM members
              LEFT JOIN notes ON (notes.memberId=members.id)
              LEFT JOIN wordnote ON (notes.id=wordnote.noteId)
              LEFT JOIN words ON (words.id=wordnote.wordId)
            WHERE
              words.bookId=${bookId}
              members.id!=416
            ORDER BY
              members.role DESC
          `
        
          connection.query(contributorsStatement, (err, contributorsResult) => {
            if(err) throw err

            fs.readFile(`${importDir}/${bookURIsByBookId[bookId]}`, 'utf-8', (err, xml) => {
              console.log(`====================================================================================`)
              console.log(`  Began ${bookURIsByBookId[bookId]}...`)

              if(err) { 
                console.log(err)
                process.exit()
              }

              parser.parseString(xml, function (err, jsonObj) {

                const convertObj = obj => {
                  const newObj = {
                    "=": obj["#name"]
                  }
                  if(obj["$"]) {
                    newObj["@"] = obj["$"]
                  }
                  if(obj["$$"] && obj["_"]) {

                    const complexWordBreakupMap = {
                      "גָּח֜ן": ["גָּח֜", "ן"],
                      "מִשְׁפָּטָ֖/": ["מִשְׁפָּטָ֖/", ""],
                      "שְׁמַ֖": ["שְׁמַ֖", ""],
                      "אֶחָֽ": ["אֶחָֽ", ""],
                      "מְשֶּׁ֜ה": ["מְ", "שֶּׁ֜ה"],
                      "אֹ֖רֶ": ["אֹ֖רֶ", ""],
                      "וּ/נְבֽוּשַׁזְבָּ": ["וּ/נְבֽוּשַׁזְבָּ", ""],
                      "מִ/יָּ֑ר": ["מִ/יָּ֑", "ר"],
                      "וְ֝/נִרְגָּ֗": ["וְ֝/נִרְגָּ֗", ""],
                      "רְשָׁים": ["רְשָׁ", "ים"],
                      "מֵ/רְשָׁים": ["מֵ/רְשָׁ", "ים"],
                    }

                    Object.keys(complexWordBreakupMap).some(word => {
                      if(obj["_"] == word) {
                        newObj["group"] = [
                          complexWordBreakupMap[word][0],
                          {
                            "=": obj["$$"][0]["#name"],
                            "@": obj["$$"][0]["$"],
                            "#": obj["$$"][0]["_"],
                          },
                          complexWordBreakupMap[word][1],
                        ]
                        return true
                      }
                    })
                    // console.log(obj)
                  } else if(obj["$$"]) {
                    newObj["group"] = obj["$$"].map(child => convertObj(child))
                  } else if(obj["_"]) {
                    newObj["#"] = obj["_"]
                  }

                  return newObj
                }
                        
                jsonObj.osis = convertObj(jsonObj.osis)

                // put in the new data

                let resultIndex = 0
                let unverifieds = 0

                const updateWord = jsonWord => {
                  let wordText = jsonWord['#'] || ''
                  ;(jsonWord.group || []).forEach(wordPart => {
                    wordText += wordPart['#'] || wordPart
                  })
                  if(result[resultIndex].word !== wordText) {
                    console.log(`UNEXPECTED WORD: ${JSON.stringify(result[resultIndex])} VS ${JSON.stringify(jsonWord)}`)
                    // process.exit()
                  }
                  if(result[resultIndex].lemma !== jsonWord['@'].lemma) {
                    console.log(`UNEXPECTED LEMMA: ${JSON.stringify(result[resultIndex])} VS ${JSON.stringify(jsonWord)}`)
                    jsonWord['@'].lemma = result[resultIndex].lemma
                    // process.exit()
                  }

                  if(result[resultIndex].status == 'verified') {
                    jsonWord['@'].morph = result[resultIndex].morph
                  } else {
                    delete jsonWord['@'].morph
                    unverifieds++
                  }

                  resultIndex++
                }

                jsonObj.osis.group[0].group[1].group.forEach(chapter => {
                  if(chapter['='] != 'chapter') {
                    console.log(`UNEXPECTED TAG: ${JSON.stringify(chapter)}`)
                    process.exit()
                  }
                  chapter.group.forEach(verse => {
                    if(verse['='] != 'verse') {
                      console.log(`UNEXPECTED TAG: ${JSON.stringify(verse)}`)
                      process.exit()
                    }
                    verse.group.forEach(wordOrSomethingElse => {
                      if(wordOrSomethingElse['='] == 'w') {
                        updateWord(wordOrSomethingElse)
                      } else if(wordOrSomethingElse['='] == 'seg') {
                        if(![result[resultIndex-1].append, 'פ', 'ס', '׆'].includes(wordOrSomethingElse['#'].trim())) {
                          console.log(`UNEXPECTED SEG: ${JSON.stringify(wordOrSomethingElse)}`)
                        }
                      } else if(wordOrSomethingElse['='] == 'note') {
                        if(wordOrSomethingElse['@'] && wordOrSomethingElse['@'].type == 'variant') {
                          wordOrSomethingElse.group.some(noteChild => {
                            if(noteChild['='] == 'rdg') {
                              ;(noteChild.group || []).forEach(qereOrSomethingElse => {
                                if(qereOrSomethingElse['='] == 'w') {
                                  updateWord(qereOrSomethingElse)
                                }
                              })
                            }
                          })
                        }
                      } else {
                        console.log(`UNEXPECTED TAG: ${JSON.stringify(wordOrSomethingElse)}`)
                        process.exit()
                      }

                    })
                  })
                })

                // add in / update headers

                jsonObj.osis.group[0].group[0].group.unshift({
                  '=': 'revisionDesc',
                  '@': {
                    resp: 'dt',
                  },
                  group: [
                    {
                      '=': 'date',
                      '#': '2013.12.11',
                    },
                    {
                      '=': 'p',
                      '#': 'Release of full morphology' + (unverifieds ? ' (incomplete pre-release)' : ''),
                    },
                  ],
                })

                jsonObj.osis.group[0].group[0].group.some(headerTag => {
                  if(headerTag['@'] && headerTag['@'].osisWork == 'OSHM') {
                    headerTag.group.some(headerTagChild => {
                      if(headerTagChild['='] == 'date') {
                        headerTagChild['#'] = today
                        return true
                      }
                    })

                    const roleMap = {
                      Administrator: 'ctb',
                      Editor: 'ctb',  // edt
                      Contributor: 'ctb',
                    }

                    contributorsResult.forEach(contributorRow => {
                      if(contributorRow.firstName || contributorRow.lastName) {
                        headerTag.group.push({
                          '=': 'contributor',
                          '@': {
                            role: roleMap[contributorRow.role],
                          },
                          '#': `${contributorRow.firstName} ${contributorRow.lastName}`,
                        })
                      }
                    })
                    
                    return true
                  }
                })
                
                // report

                if(unverifieds) {
                  console.log(`    ${unverifieds} unverified words.`)
                } else {
                  console.log(`    COMPLETE!`)
                }


                let newXml = js2xmlparser.parse('osis', jsonObj.osis, {
                  declaration: {
                    encoding: "utf-8",
                  },
                  format: {
                    doubleQuotes: true,
                    indent: "  ",
                  },
                })

                // format newlines like the morphhb files
                newXml = `${newXml}\n`
                  .replace(/(>)\n *(<seg type="x-sof-pasuq">׃<\/seg>)/g, "$1$2")
                  .replace(/(<\/w>|<\/note>)\n *(<seg type="x-maqqef">־<\/seg>)\n *(<w )/g, "$1$2$3")
                  .replace(/(<\/w>)\n *(<note type="[^"]*">)\n *(<catchWord>[^<]*<\/catchWord>)\n *(<rdg type="[^"]*">[^<]*<\/rdg>)\n *(<\/note>)/g, "$1$2$3$4$5")
                  .replace(/(<\/w>)\n *(<note type="[^"]*">)\n *(<catchWord>[^<]*<\/catchWord>)\n *(<rdg type="[^"]*"\/>)\n *(<\/note>)/g, "$1$2$3$4$5")
                  .replace(/(<\/w>)\n *(<note type="[^"]*">)\n *(<catchWord>[^<]*<\/catchWord>)\n *(<rdg type="[^"]*">)\n *([^\n]*)\n *(<\/rdg>)\n *(<\/note>)/g, "$1$2$3$4$5$6$7")
                  .replace(/(<\/w>\n *<note type="[^"]*">)\n *(<rdg type="[^"]*">)\n *([^\n]*)\n *(<\/rdg>)\n *(<\/note>)/g, "$1$2$3$4$5")
                  .replace(/(<\/w>)\n *(<seg type="x-maqqef">־<\/seg>)\n *(<note type="[^"]*">)\n *(<rdg type="[^"]*">)\n *([^\n]*)\n *(<\/rdg>)\n *(<\/note>)/g, "$1$2$3$4$5$6$7")
                  .replace(/(<\/w>)\n *(<note type="[^"]*">)\n *(<catchWord>[^<]*<\/catchWord>)\n *(<rdg type="[^"]*">)\n *([^\n]*)(?:\n *([^\n]*))\n *(<\/rdg>)\n *(<\/note>)/g, "$1$2$3$4$5 $6$7$8")
                  .replace(/(<\/w>)\n *(<note type="[^"]*">)\n *(<catchWord>[^<]*<\/catchWord>)\n *(<rdg type="[^"]*">)\n *([^\n]*)(?:\n *([^\n]*))(?:\n *([^\n]*))\n *(<\/rdg>)\n *(<\/note>)/g, "$1$2$3$4$5 $6$7$8$9")
                  .replace(/(<w [^>]*>)\n *<group>([^<]*)<\/group>\n *(<seg [^>]*>)([^<]*)(<\/seg>)\n *<group>([^<]*)<\/group>\n *(<\/w>)/g, "$1$2$3$4$5$6$7")
                  
                fs.writeFile(`${exportDir}/${bookURIsByBookId[bookId]}`, newXml, function(err) {
                    if(err) {
                        return console.log(err);
                    }
          
                    console.log(`    Wrote ${bookURIsByBookId[bookId]}.`)

                    // shell.exec(`diff ${importDir}/${bookURIsByBookId[bookId]} ${exportDir}/${bookURIsByBookId[bookId]}`)

                    bookId++ && exportBook()
                })

              })
            })
          })
        })
      }
            
      exportBook()
                  
    },

    () => {
      console.log(`\nCOMPLETED\n`)
      process.exit()
    }
    
  ])
})
