require('dotenv').config()

var mysql = require('mysql')

var fix = require('./scripts/fix')
var weedOut = require('./scripts/weed_out')
var flag = require('./scripts/flag')
var compare = require('./scripts/compare')
var autoParse = require('./scripts/auto_parse')
var check = require('./scripts/check')
var validate = require('./scripts/validate')

var connection = mysql.createConnection({
  host: process.env.DB_NAME || "localhost",
  database: process.env.HOSTNAME || 'oshb-parsing',
  user: process.env.USERNAME || "root",
  password: process.env.PASSWORD || "",
});

connection.connect(function(err) {
  if (err) throw err;

  console.log(`STARTING`)

  fix(connection)
  weedOut(connection)
  flag(connection)
  compare(connection)
  autoParse(connection)
  check(connection)
  validate(connection)

  console.log(`COMPLETED`)

  process.exit()
});