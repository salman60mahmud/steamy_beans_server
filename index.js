const express = require('express')
const app = express()
var cors = require('cors')
const port = process.env.PORT || 5000

// Middleware
app.use(cors())
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Steamy Beans app listening on port ${port}`)
})
