const utils = require('../utils')

const suffixParsingMap = {
  "י": "/Sp1cs",
  "נִי": "/Sp1cs",
  "נִּי": "/Sp1cs",
  "נוּ": "/Sp1cp",
  "ךָ": "/Sp2ms",
  "כָּה": "/Sp2ms",
  "ךְ": "/Sp2fs",
  "כֶם": "/Sp2mp",
  "כֶן": "/Sp2fp",
  "וֹ": "/Sp3ms",
  "ו": "/Sp3ms",
  "הוּ": "/Sp3ms",
  "מוֹ": "/Sp3ms",
  "הּ": "/Sp3fs",
  "הָ": "/Sp3fs",
  "הָ": "/Sp3fs",
  "נָּה": "/Sp3fs",
  "ם": "/Sp3mp",
  "הֶם": "/Sp3mp",
  "הֶן": "/Sp3fp",
  "ה": "/Sh",
  "ן": "/Sn",
}

const autoValidateMap = {
  "אֶחָד": "HAcmsa",
  "אֵין": "HTn",
  "וְ/הִנֵּה": "HC/Tm",
  "וְ/אֵין": "HC/Tn",
  "סָבִיב": "HD",
  "לָ/כֵן": "HR/D",
  "הַ/לְוִיִּם": "HTd/Ngmpa",
  "שָׁמָּ/ה": "HD/Sd",
  "לָ/מָּה": "HR/Ti",
  "פְּלִשְׁתִּים": "HNgmpa",
  "פְלִשְׁתִּים": "HNgmpa",
  "עֶשְׂרִים": "HAcbpa",
  "אֲלָפִים": "HAcbpa",
  "שְׁלֹשִׁים": "HAcbpa",
  "מֵאָה": "HAcbsa",
  "חֲמִשִּׁים": "HAcbpa",
  "שְׁתֵּי": "HAcfdc",
  "וְ/עֶשְׂרִים": "HC/Acbpa",
  "אַרְבָּעִים": "HAcbpa",
  "הַ/שְּׁבִיעִי": "HTd/Aomsa",
  "הָ/אֱמֹרִי": "HTd/Ngmsa",
  "שְׁנֵים": "HAcmda",
  "שִׁבְעִים": "HAcbpa",
  "אָלֶף": "HAcbsa",
  "שְׁלֹשׁ": "HAcfsc",
  "וְ/הַ/לְוִיִּם": "HC/Td/Ngmpa",
  "לְ/עֵינֵי": "HR/Ncbdc",
  "וּ/שְׁלֹשִׁים": "HC/Acbpa",
  "הַ/כְּנַעֲנִי": "HTd/Ngmsa",
  "הַ/שְּׁלִישִׁי": "HTd/Aomsa",
  "וַ/חֲמִשִּׁים": "HC/Acbpa",
  "הָ/אֲרָצוֹת": "HTd/Ncbpa",
  "וְ/אַרְבָּעָה": "HC/Acmsa",
  "מָאתַיִם": "HAcbda",
  "וְ/חָמֵשׁ": "HC/Acfsa",
  "לְ/עֵינֵי/הֶם": "HR/Ncbdc/Sp3mp",
  "עֵינֵי": "HNcbdc",
  "בְּ/עֵינֶי/ךָ": "HR/Ncbdc/Sp2ms",
  "עֵינַ/י": "HNcbdc/Sp1cs",
  "בְּ/עֵינָי/ו": "HR/Ncbdc/Sp3ms",
  "עֵינִ/י": "HNcbsc/Sp1cs",
  "בְּ/עֵינֵי/כֶם": "HR/Ncbdc/Sp2mp",
  "עֵינֵי/הֶם": "HNcbdc/Sp3mp",
  "עֵינֵי/כֶם": "HNcbdc/Sp2mp",
  "וְ/עֵינָי/ו": "HC/Ncbdc/Sp3ms",
  "וּ/בְ/עֵינֵי": "HC/R/Ncbdc",
  "עֵינַיִ/ךְ": "HNcbdc/Sp2fs",
  "עֵינֵי/נוּ": "HNcbdc/Sp1cp",
  "וְ/עֵינֵי": "HC/Ncbdc",
  "חֲמֵשׁ": "HAcfsc",
  "בְּעַד": "HR",
  "תַּחְתָּי/ו": "HR/Sp3ms",
  "וּ/בֵין": "HC/R",
  "אַחֲרֵי/הֶם": "HR/Sp3mp",
  "וְ/אַחֲרֵי": "HC/R",
  "מִ/כֶּם": "HR/Sp2mp",
  "וְ/אַרְבָּעִים": "HC/Acbpa",
  "אַשְׁרֵי": "HNcmpa",
  "בְּ/טֶרֶם": "HR/D",
  "צָפוֹנָ/ה": "HNcfsa/Sd",
  "שְׁאוֹל": "HNp",
  "וָ/מַעְלָ/ה": "HC/D/Sd",
  "לַ/לְוִיִּם": "HRd/Ngmpa",
  "וּ/מֵאָה": "HC/Acbsa",
  "אֶחָת": "HAcfsa",
  "הַ/פְּלִשְׁתִּי": "HTd/Ngmsa",
  "שִׁשִּׁים": "HAcbpa",
  "וּ/שְׁלֹשָׁה": "HC/Acmsa",
  "הַ/מִּזְבֵּחָ/ה": "HTd/Ncmsa/Sd",
  "הַ/חִתִּי": "HTd/Ngmsa",
  "הָ/אֶחָת": "HTd/Acfsa",
  "וְ/שִׁבְעָה": "HC/Acmsa",
  "שִׁשָּׁה": "HAcmsa",
  "שְׁתֵּים": "HAcfda",
  "אָנָה": "HD",
  "הַ/שְּׁמִינִי": "HTd/Aomsa",
  "מִזְרָחָ/ה": "HNcmsa/Sd",
  "אַלְפַּיִם": "HAcbda",
  "וְ/לָ/מָּה": "HC/R/Ti",
  "וְ/שִׁשִּׁים": "HC/Acbpa",
  "וַ/חֲמֵשׁ": "HC/Acfsc",
  "וּ/שְׁנַיִם": "HC/Acmda",
  "וּ/שְׁתֵּי": "HC/Acfdc",
  "שְׁבַע": "HAcfsc",
  "וּ/שְׁתַּיִם": "HC/Acfda",
  "אַחַד": "HAcmsc",
  "מֵ/אֵין": "HR/Tn",
  "מוּל": "HR",
  "וְ/שִׁבְעִים": "HC/Acbpa",
  "הֲדַד": "HNp",
  "חֲמֵשֶׁת": "HAcmsc",
  "הָ/רְבִיעִי": "HTd/Aomsa",
  "לָ/מָה": "HR/Ti",
  "בְּלִי": "HTn",
  "וְ/אַחַת": "HC/Acfsa",
  "דְּרָכָי/ו": "HNcbpc/Sp3ms",
  "וְ/אֶחָד": "HC/Acmsa",
  "וּ/שְׁבַע": "HC/Acfsc",
  "וְ/הַ/יְבוּסִי": "HC/Td/Ngmsa",
  "הַ/חֲמִישִׁי": "HTd/Aomsa",
  "הָ/אַחַת": "HTd/Acfsa",
  "וְ/שִׁשָּׁה": "HC/Acmsa",
  "כֻּלֹּ/ה": "HNcmsc/Sp3fs",
  "אֱדֹם": "HNp",
  "וּ/פְלִשְׁתִּים": "HC/Ngmpa",
  "בְּ/אֶחָד": "HR/Acmsa",
  "דָּנִיֵּאל": "HNp",
  "יְעָרִים": "HNp",
  "לִ/שְׁנֵי": "HR/Acmdc",
  "הַ/שִּׁשִּׁי": "HTd/Aomsa",
  "בַּ/חֲמִשָּׁה": "HR/Acmsa",
  "מִמֶּ/ךָּ": "HR/Sp2ms",
  "תְּהוֹם": "HNcbsa",
  "לְ/מַעְלָ/ה": "HR/D/Sd",
  "שָׁקֵה": "HNp",
  "הַ/חוּצָ/ה": "HTd/Ncmsa/Sd",
  "וּ/מְאַת": "HC/Acbsc",
  "הַ/חִוִּי": "HTd/Ngmsa",
  "אַיִן": "HTn",
  "הַ/יְבוּסִי": "HTd/Ngmsa",
  "טֶרֶם": "HD",
  "וּ/מָאתַיִם": "HC/Acbda",
  "בֵּינִ/י": "HR/Sp1cs",
  "וּ/מָאתָיִם": "HC/Acbda",
  "תִּשְׁעִים": "HAcbpa",
  "דַּרְכֵי": "HNcbpc",
  "אַרְבַּעַת": "HAcmsc",
  "וְ/הַ/פְּרִזִּי": "HC/Td/Ngmsa",
  "תְּשַׁע": "HAcfsc",
  "בָּ/הֵן": "HR/Sp3fp",
  "מְאַת": "HAcbsc",
  "ל/וֹ": "HR/Sp3ms",
  "וְ/הָ/אֱמֹרִי": "HC/Td/Ngmsa",
  "מִ/בֵּין": "HR/R",
  "הָ/עֲשִׂירִי": "HTd/Aomsa",
  "לְ/נֶגֶד": "HR/R",
  "וּ/בֵינֶ/ךָ": "HC/R/Sp2ms",
  "הַ/מִּדְבָּרָ/ה": "HTd/Ncmsa/Sd",
  "וְ/הַ/כְּנַעֲנִי": "HC/Td/Ngmsa",
  "שְׁנָיִם": "HAcmda",
  "כְּ/אַחַד": "HR/Acmsc",
  "וּ/שְׁלֹשׁ": "HC/Acfsc",
  "בִּי": "HTe",
  "אַחֲרֶי/הָ": "HR/Sp3fs",
  "הָ/עִבְרִים": "HTd/Ngmpa",
  "בְּ/עוֹד": "HR/D",
  "עֹד": "HD",
  "הַ/קְּהָתִי": "HTd/Ngmsa",
  "נֶגְדּ/וֹ": "HR/Sp3ms",
  "וְ/שָׁלֹשׁ": "HC/Acfsa",
  "וּ/שְׁמֹנִים": "HC/Acbpa",
  "בְּ/אַחַד": "HR/Acmsc",
  "בַּ/פְּלִשְׁתִּים": "HRd/Ngmpa",
  "דְּרָכֶי/ךָ": "HNcbpc/Sp2ms",
  "בְּ/עֶשְׂרִים": "HR/Acbpa",
  "וּ/שְׁנֵים": "HC/Acmda",
  "וּ/בְעַד": "HC/R",
  "וּ/שְׁלֹשֶׁת": "HC/Acmsc",
  "תֵּימָנָ/ה": "HNcfsa/Sd",
  "הַ/גֵּרְשֻׁנִּי": "HTd/Ngmsa",
  "הַ/יָּמָּ/ה": "HTd/Ncmsa/Sd",
  "דְּרָכַ/י": "HNcbpc/Sp1cs",
  "הַ/גִּלְעָדִי": "HTd/Ngmsa",
  "שֵׁנִי": "HAomsa",
  "הַ/מִּצְרִי": "HTd/Ngmsa",
  "הַ/בַּיְתָ/ה": "HTd/Ncmsa/Sd",
  "שְׁמֹנִים": "HAcbpa",
  "וּ/בֵינֵי/כֶם": "HC/R/Sp2mp",
  "לְ/נֶגְדִּ/י": "HR/R/Sp1cs",
  
  // etcbc has these as both. if we decide not to parse them as both, add them here
  // "הַ/בָּקָר": "HTd/Ncmsa",
  // "בָּקָר": "HNcmsa",
  // "בָקָר": "HNcmsa",
  // "וּ/בָקָר": "HC/Ncmsa",
  // "כְּבוֹד": "HNcmsc",
  // "כָּבוֹד": "HNcmsa",
  // "וְ/כָבוֹד": "HC/Ncmsa",
  // "וּ/כְבוֹד": "HC/Ncmsc",
  // "כְבוֹד": "HNcmsc",
  // "כְּבוֹד/וֹ": "HNcmsc/Sp3ms",
  // "כְּבוֹדִ/י": "HNcmsc/Sp1cs",
  // "הַ/חֲמוֹר": "HTd/Ncmsa",
  // "חֶבֶל": "HNcmsc",
  // "הַ/לֶּחֶם": "HTd/Ncmsa",
  
  // need to check these 
  // "פַרְעֹה": "HNp",
  // "יַחַד": "HD",
  // "אָכֵן": "HD",
  // "סְבִיבוֹת": "HD",
  // "תָמִיד": "HD",
  // "אֲבָל": "HD",
  // "אֵצֶל": "HR",
  
  // waiting for slack answer on these
  // "הַ/הִיא": "HTd/Pdxfs",
  // "הָ/הֵם": "HTd/Pdxcp",
  // "הָ/הֵמָּה": "HTd/Pdxcp",
  // "עִמָּדִ/י": "HR/Sp1cs",
}

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

          const compareResult = utils.compareWithETCBC({ row, skipAddl: true })

          if(compareResult == "unknown" && autoValidateMap[row.accentlessword] != row.morph) return

          let newStatus = row.status

          if(
            row.morph == row.etcbcMorph
            || (
              row.morph.replace(/^(H(?:[^\/]*\/)*[^\/]+)(\/S[^\/]+)$/, '$1') == row.etcbcMorph.replace(/^(H(?:[^\/]*\/)*(?:N[^\/][^\/][^\/]|A[^\/][^\/][^\/]|V[^\/][rs][^\/][^\/]))a/, '$1c')
              && row.morph.replace(/^(H(?:[^\/]*\/)*[^\/]+)(\/S[^\/]+)$/, '$2') == suffixParsingMap[utils.makeAccentless(row.word.replace(/^.*\/([^\/]+)$/, '$1'))]
            )
            || autoValidateMap[row.accentlessword] == row.morph
          ) {
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
          console.log(`    ${mismatchedWord.accentlessword} ${mismatchedWord.morph} ${mismatchedWord.etcbcMorph} (${mismatchedWord.num}x was verified but didn't match)`)
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