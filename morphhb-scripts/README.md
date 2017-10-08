## Installation

`npm install`

Create `.env` and add `DB_NAME`, `HOSTNAME`, `USERNAME`, `PASSWORD`

## Executing

`node run.js`

## The Scripts

#### fix

Corrects parsings (morph column) in the notes_enhanced table according to the rules [here](https://docs.google.com/document/d/1VcXFAvxROGsA7NLHCzb8ZaToI_1NWuHgunY5znukR0g/edit#).

#### weedOut

Deletes rows from the notes_enhanced table according to the rules [here](https://docs.google.com/document/d/1VcXFAvxROGsA7NLHCzb8ZaToI_1NWuHgunY5znukR0g/edit#).

#### flag

Not yet implemented.

#### compare

Updates the morph and status columns in the words_enhanced table based upon the updated notes_enhanced table

#### guessParse

Updates the morph column (and gives it a status of `single`) of the words_enhanced table where the status is `none`
or `conflict`, and the word can be guessed at based on the parsing of this form in other places.

#### autoParse

Updates the morph column (and gives it a status of `single`) on common forms (with pre-determined parsings) of the
words_enhanced table where the status is not `confirmed` or `verified`. For example, prototypical uses of particles
are parsed in this fashion.

#### check

Not yet implemented.

#### validate

Not yet implemented.
