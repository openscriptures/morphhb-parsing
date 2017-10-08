const utils = require('../utils')

module.exports = (connection, done) => {
  
  console.log(`\nRunning auto-parse script...`)

  // Updates the words_enhanced table [and eventually will also insert into the notes and wordnote table with memberid=0]
  // according to pre-determined parsing for common forms

  // per form
  const formParsings = {

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
    // "בִּי": "HTe (when not preposition with 1cs suffix)",
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

    // Fixes to common mis-parsed words
    "אֲדֹנָי/ו": "HNcmpc/Sp3ms",
    
  }

  const updates = []

  for(let form in formParsings) {
    updates.push(`
      UPDATE words_enhanced SET morph='${formParsings[form]}', status='single'
        WHERE 
          accentlessword='${form}'
          AND status NOT IN('confirmed', 'verified')
      `)
  }

  utils.doUpdatesInChunks(connection, { updates }, numRowsUpdated => {
    console.log(`  ${numRowsUpdated} words were auto-parsed according to pre-determined parsing for common forms.`)
    console.log(`Done with auto-parse script.`)
    done()
        
  })
  
}