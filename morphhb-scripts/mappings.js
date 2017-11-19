const suffixParsingMap = {
  "י": "/Sp1cs",
  "נִי": "/Sp1cs",
  "נִּי": "/Sp1cs",
  "נוּ": "/Sp1cp",
  "נּוּ": "/Sp1cp",
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

// Mapping for words that should be auto-parsed if not otherwise indicated.
// These will not automatically get verified.
const autoParseMap = {

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
  "הָהּ": "HTj",
  "הוֹ": "HTj",
  "הֶאָח": "HTj",
  "אִי": "HTj",
  "הִנֵּה": "HTm",
  "וְ/הִנֵּה": "HC/Tm",
  "הֵן": "HTm",
  "כֵּן": "HTm",
  "לֹא": "HTn",
  "אַל": "HTn",
  "בַּל": "HTn",
  "בִּלְתִּי": "HC",
  "לְ/בִלְתִּי": "HR/C",
  "פֹּה": "HD",
  "כֹּה": "HD",
  "אַי": "HD",
  "וְ/אִם": "HC/C",
  "וְ/גַם": "HC/Ta",
  "וְ/רַק": "HC/Ta",
  "וְ/כֵן": "HC/Tm",
  "וְ/לֹא": "HC/Tn",
  "וְ/אַל": "HC/Tn",
  "וּֽ/בַל": "HC/Tn",
  "וְ/אָנוּ": "HC/D",
  "וְ/כֹֽה": "HC/D",

  // Fixes to common mis-parsed words
  "אֲדֹנָי/ו": "HNcmpc/Sp3ms",
  "יְשַׁלֵּם": "HVpi3ms",
  "וַ/יַּעֲלוּ": "HC/Vqw3mp",
  "מֵ/אֵת": "HR/R",
  "בְּ/תוֹךְ": "HR/Ncmsc",
  "בַּ/מִּדְבָּר": "HRd/Ncmsa",
  "שָׁמַיִם": "HNcmpa",
  "שְׁנֵי/הֶם": "HAcmpc/Sp3mp",
  "הָ/רִאשׁוֹן": "HTd/Aomsa",
  "וַ/אֲשֶׁר": "HC/Tr",
  "לָא": "HTn",
  "לוֹא": "HTn",
  "אֵי": "HTi",
  "מָחָר": "HNcmsa",
  "כָּל": "HNcmsc",
  "וְ/כָל": "HC/Ncmsc",
  "בְּ/כָל": "HR/Ncmsc",
  "כָל": "HNcmsc",
  "וְ/עַד": "HC/R",
  "לְ/כָל": "HR/Ncmsc",
  "יַעַן": "HC",
  "בְנ/וֹ": "HNcmsc/Sp3ms",
  "בְּ/עֵינֵי": "HR/Ncfdc",
  "אֱלֹהֵי/כֶם": "HNcmpc/Sp2mp",
  "שִׁבְעָה": "HAcmsa",
  "שְׁמֶ/ךָ": "HNcmsc/Sp2ms",
  "חֲמִשָּׁה": "HAcmsa",
  "יֶשׁ": "HTa",
  "אָמֵן": "HD",
  "כְּתוּבִים": "HVqsmpa",
  "שָׁפָן": "HNcmsa",
}

// Mapping for auto-parsing, even verified forms.
// This will also auto-verify these forms.
const autoParseAndValidateMap = {

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
  "אֵלֶּה": "HPdxcp",
  "וְ/אֵלֶּה": "HC/Pdxcp",
  "בְּ/אֵלֶּה": "HR/Pdxcp",
  "מֵ/אֵלֶּה": "HR/Pdxcp",
  "לָ/אֵלֶּה": "HR/Pdxcp",
  "הָ/אֵלֶּה": "HTd/Pdxcp",
  
  // מַעְלָ/ה is always D/Sd (per Joel via Slack)
  "מַעְלָ/ה": "HD/Sd",
  "וָ/מַעְלָ/ה": "HC/D/Sd",
  "וּ/לְ/מַעְלָ/ה": "HC/R/D/Sd",
  "וּ/מִ/לְ/מַעְלָ/ה": "HC/R/R/D/Sd",
  "לְ/מַעְלָ/ה": "HR/D/Sd",
  "מִ/לְ/מַעְלָ/ה": "HR/R/D/Sd",

  // טֶרֶם  is always an adverb (per Joel via Slack)
  "טֶרֶם": "HD",
  "בְּ/טֶרֶם": "HR/D",
  "הֲ/טֶרֶם": "HTd/D",
  "וְ/טֶרֶם": "HC/D",
  "וּ/בְ/טֶרֶם": "HC/R/D",

  // פנים
  "לְ/פָנֵי/נוּ": "HR/Ncmpc/Sp1cp",
  "מִ/לְּ/פָנֵ/נוּ": "HR/R/Ncmpc/Sp1cp",
  "מִ/פָּנֵי/נוּ": "HR/Ncmpc/Sp1cp",
  "פָּנֵי/נוּ": "HNcmpc/Sp1cp",
  "פָּנַיִ/ךְ": "HNcmpc/Sp2fs",
  "פָנֵי/מוֹ": "HNcmpc/Sp3ms",
  "בְּ/פָנִים": "HR/Ncmpa",
  "בְּ/פָנֶי/הָ": "HR/Ncmpc/Sp3fs",
  "בְּ/פָנֶי/ךָ": "HR/Ncmpc/Sp2ms",
  "בְּ/פָנַ/י": "HR/Ncmpc/Sp1cs",
  "בְּ/פָנָי/ו": "HR/Ncmpc/Sp3ms",
  "בִּ/פְנֵי": "HR/Ncmpc",
  "בִּ/פְנֵי/הֶם": "HR/Ncmpc/Sp3mp",
  "בִּ/פְנֵי/כֶם": "HR/Ncmpc/Sp2mp",
  "הַ/פָּנִים": "HTd/Ncmpa",
  "ו/פני": "HC/Ncmpc",
  "וְ/לִ/פְנֵי": "HC/R/Ncmpc",
  "וְ/לִ/פְנֵי/הֶם": "HC/R/Ncmpc/Sp3mp",
  "וּ/לְ/פָנֶי/ךָ": "HC/R/Ncmpc/Sp2ms",
  "וּ/לְ/פָנָי/ו": "HC/R/Ncmpc/Sp3ms",
  "וּ/מִ/לְּ/פָנִים": "HC/R/R/Ncmpa",
  "וּ/מִ/לִּ/פְנֵי": "HC/R/R/Ncmpc",
  "וּ/מִ/פְּנֵי": "HC/R/Ncmpc",
  "וּ/מִ/פְּנֵי/הֶם": "HC/R/Ncmpc/Sp3mp",
  "וּ/מִ/פָּנֶי/ךָ": "HC/R/Ncmpc/Sp2ms",
  "וּ/מִ/פָּנַ/י": "HC/R/Ncmpc/Sp1cs",
  "וּ/פְנֵי": "HC/Ncmpc",
  "וּ/פְנֵי/הֶם": "HC/Ncmpc/Sp3mp",
  "וּ/פָנִים": "HC/Ncmpa",
  "וּ/פָנֶי/הָ": "HC/Ncmpc/Sp3fs",
  "וּ/פָנֶי/ךָ": "HC/Ncmpc/Sp2ms",
  "וּ/פָנַ/י": "HC/Ncmpc/Sp1cs",
  "וּ/פָנָי/ו": "HC/Ncmpc/Sp3ms",
  "כְּ/מִ/פְּנֵי": "HR/R/Ncmpc",
  "לְ/פָנִים": "HR/Ncmpa",
  "לְ/פָנֶי/הָ": "HR/Ncmpc/Sp3fs",
  "לְ/פָנֶי/ךָ": "HR/Ncmpc/Sp2ms",
  "לְ/פָנַ/י": "HR/Ncmpc/Sp1cs",
  "לְ/פָנָ/י": "HR/Ncmpc/Sp1cs",
  "לְ/פָנָי/ו": "HR/Ncmpc/Sp3ms",
  "לִ/פְנֵי": "HR/Ncmpc",
  "לִ/פְנֵי/הֶם": "HR/Ncmpc/Sp3mp",
  "לִ/פְנֵי/כֶם": "HR/Ncmpc/Sp2mp",
  "לַ/פָּנִים": "HR/Ncmpa",
  "מִ/לְּ/פָנֶי/ךָ": "HR/R/Ncmpc/Sp2ms",
  "מִ/לְּ/פָנַ/י": "HR/R/Ncmpc/Sp1cs",
  "מִ/לְּ/פָנָ/י": "HR/R/Ncmpc/Sp1cs",
  "מִ/לְּ/פָנָי/ו": "HR/R/Ncmpc/Sp3ms",
  "מִ/לִּ/פְנִים": "HR/R/Ncmpa",
  "מִ/לִּ/פְנֵי": "HR/R/Ncmpc",
  "מִ/לִּ/פְנֵי/כֶם": "HR/R/Ncmpc/Sp2mp",
  "מִ/פְּנֵי": "HR/Ncmpc",
  "מִ/פְּנֵי/הֶם": "HR/Ncmpc/Sp3mp",
  "מִ/פְּנֵי/כֶם": "HR/Ncmpc/Sp2mp",
  "מִ/פָּנִים": "HR/Ncmpa",
  "מִ/פָּנֶי/ה": "HR/Ncmpc/Sp3fs",
  "מִ/פָּנֶי/הָ": "HR/Ncmpc/Sp3fs",
  "מִ/פָּנֶי/ךָ": "HR/Ncmpc/Sp2ms",
  "מִ/פָּנַ/י": "HR/Ncmpc/Sp1cs",
  "מִ/פָּנָ/י": "HR/Ncmpc/Sp1cs",
  "מִ/פָּנָי/ו": "HR/Ncmpc/Sp3ms",
  "פְנֵי": "HNcmpc",
  "פְנֵי/הֶם": "HNcmpc/Sp3mp",
  "פְנֵי/כֶם": "HNcmpc/Sp2mp",
  "פָנִים": "HNcmpa",
  "פָנֶי/הָ": "HNcmpc/Sp3fs",
  "פָנֶי/ךָ": "HNcmpc/Sp2ms",
  "פָנַ/י": "HNcmpc/Sp1cs",
  "פָנָ/י": "HNcmpc/Sp1cs",
  "פָנָי/ו": "HNcmpc/Sp3ms",
  "פְּנֵי": "HNcmpc",
  "פְּנֵי/הֶם": "HNcmpc/Sp3mp",
  "פְּנֵי/כֶם": "HNcmpc/Sp2mp",
  "פָּנִים": "HNcmpa",
  "פָּנֶי/הָ": "HNcmpc/Sp3fs",
  "פָּנֶי/ךָ": "HNcmpc/Sp2ms",
  "פָּנַ/י": "HNcmpc/Sp1cs",
  "פָּנָ/י": "HNcmpc/Sp1cs",
  "פָּנָ/יַ": "HNcmpc/Sp1cs",
  "פָּנָי/ו": "HNcmpc/Sp3ms",

  // misc
  "אֶחָד": "HAcmsa",
  "אֵין": "HTn",
  "וְ/אֵין": "HC/Tn",
  "סָבִיב": "HD",
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
  "אַחֲרֵי": "HR",
  "וְ/אַחֲרֵי": "HC/R",
  "מֵ/אַחֲרָי/ו": "HR/R/Sp3ms",
  "אַחֲרָי/ו": "HR/Sp3ms",
  "מִ/כֶּם": "HR/Sp2mp",
  "וְ/אַרְבָּעִים": "HC/Acbpa",
  "צָפוֹנָ/ה": "HNcfsa/Sd",
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
  "שָׁקֵה": "HNp",
  "הַ/חוּצָ/ה": "HTd/Ncmsa/Sd",
  "וּ/מְאַת": "HC/Acbsc",
  "הַ/חִוִּי": "HTd/Ngmsa",
  "אַיִן": "HTn",
  "הַ/יְבוּסִי": "HTd/Ngmsa",
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
  "בֵּין": "HR",
  "הָ/עֲשִׂירִי": "HTd/Aomsa",
  "לְ/נֶגֶד": "HR/R",
  "וּ/בֵינֶ/ךָ": "HC/R/Sp2ms",
  "הַ/מִּדְבָּרָ/ה": "HTd/Ncmsa/Sd",
  "וְ/הַ/כְּנַעֲנִי": "HC/Td/Ngmsa",
  "שְׁנָיִם": "HAcmda",
  "וּ/שְׁנָיִם": "HC/Acmda",
  "כְּ/אַחַד": "HR/Acmsc",
  "וּ/שְׁלֹשׁ": "HC/Acfsc",
  "בִּי": "HTe",
  "אַחֲרֶי/הָ": "HR/Sp3fs",
  "אַחֲרֶי": "HR",
  "אֲדֹנָ/י": "HNcmpc/Sp1cs",
  "תַּחַת": "HR",
  "הָ/עִבְרִים": "HTd/Ngmpa",
  "בְּ/עוֹד": "HR/D",
  "עוֹד": "HD",
  "עֹד": "HD",
  "הַ/קְּהָתִי": "HTd/Ngmsa",
  "נֶגְדּ/וֹ": "HR/Sp3ms",
  "נֶגְדּ": "HR",
  "נֶגֶד": "HR",
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
  "מְאֹד": "HD",
  "עֶשְׂרֵה": "HAcfsa",
  "שֶׁבַע": "HAcfsa",
  "שְׁלֹשָׁה": "HAcmsa",
  "עֲשָׂרָה": "HAcmsa",
  "מִגְרָשֶׁ/הָ": "HNcmpc/Sd",
  "שָׁלֹשׁ": "HAcfsa",
  "לא": "HTn",
  "מֵאוֹת": "HAcbpa",
  "בַּ/יּוֹם": "HRd/Ncmsa",
  "וּ/בַ/לַּיְלָה": "HC/Rd/Ncmsa",
  "לָ/כֶם": "HR/Sp2mp",
  "וַ/יֹּאמֶר": "HC/Vqw3ms",
  "לַ/מְנַצֵּחַ": "HRd/Vprmsa",
  "בְּנִ/י": "HNcmsc/Sp1cs",
  "לְ/ךָ": "HR/Sp2ms",
  "יִשְׁמְעֵאלִים": "HNgmpa",
  "וְ/יִשְׁמְעֵאלִים": "HC/Ngmpa",
  "לָ/מֶה": "HTi",
  "לָ/כֵן": "HR/D",
  "מַדּוּעַ": "HTi",
  "שְׁאוֹל": "HNp",
  "אַשְׁרֵי": "HNcmpa",
  "שִׁלְשׁוֹם": "HNcmsa",
  "הַ/יְּהוּדִים": "HTd/Ngmpa",
  "נַפְשָׁ/ם": "HNcfsc/Sp3mp",
  
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
  
  // waiting for slack answer on these
  // "פַרְעֹה": "HNp",
  // "יַחַד": "HD",
  // "אָכֵן": "HD",
  // "סְבִיבוֹת": "HD",
  // "מִ/סָּבִיב": "HR/D",
  // "תָמִיד": "HD",
  // "אֲבָל": "HD",
  // "אֵצֶל": "HR",
  // "הַ/הוּא": "HTd/Pdxms",
  // "הַ/הִוא": "HTd/Pdxfs",
  // "הַ/הִיא": "HTd/Pdxfs",
  // "הָ/הֵם": "HTd/Pdxcp",
  // "הָ/הֵמָּה": "HTd/Pdxcp",
  // "עִמָּדִ/י": "HR/Sp1cs",
}

module.exports = {
  suffixParsingMap,
  autoParseMap,
  autoParseAndValidateMap,  
}