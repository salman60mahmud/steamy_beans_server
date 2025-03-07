const express = require('express')
var cors = require('cors')
var bodyParser = require('body-parser')
const app = express()
const port = process.env.PORT || 5000


// Middlewares
app.use(cors())
app.use(bodyParser.json())

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Steamy Beans app listening on port ${port}`)
})