module.exports = (connection, done) => {
  
  console.log(`\nRunning weed-out script...`)

  // determined or absolute state with suffix following
  // TODO: presently this weeds out to much. For example, it weeds out absolutes with a directional he suffix
  // SELECT * FROM words_enhanced WHERE morph REGEXP '^H([^/]*/)*(N[^/][^/][^/]|A[^/][^/][^/]|V[^/][rs][^/][^/])[da]/'

  console.log(`Done with weed-out script.`)
  done()

}  