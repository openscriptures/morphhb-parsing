const utils = require('../utils')

module.exports = (connection, done) => {
  
  console.log(`\nRunning auto-parse script...`)

  // Updates the words_enhanced table [and eventually will also insert into the notes and wordnote table with memberid=416]
  // according to pre-determined parsing for common forms

  const updates = []

  for(let form in autoParseForms) {
    updates.push(`
      UPDATE words_enhanced SET morph='${autoParseForms[form]}', status='single'
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
  
  // Auto parse of most common forms that are not getting guess-parsed
  "כָּל": "HNcmsc",
  "וְ/כָל": "HC/Ncmsc",
  "לִ/פְנֵי": "HR/Ncbpc",
  "וַ/יֹּאמֶר": "HC/Vqw3mp",
  "בְּ/כָל": "HR/Ncmsc",
  "כָל": "HNcmsc",
  "וְ/עַד": "HC/R",
  "לְ/כָל": "HR/Ncmsc",

}
