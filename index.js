const config = require('./config')

const http = require('http')
const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const app = express()
const slack = require('./slack')

app.set('config', config)
app.use(cors())
app.use(bodyParser.json({ limit: '3mb' }))
app.use(bodyParser.urlencoded({ extended: true, limit: '3mb' }))

app.get('/', (req, res) => res.send('OK'))
app.post('/execute', (req, res) => {
  try {
    slack(req.body)

    res.send('Okay, give me a sec...')
  } catch (e) {
    console.trace(e)
    res.status(500)
    res.send()
  }
})

let server = http.createServer(app)

server.listen(config.port, () => { console.log(`Rankr running on port ${config.port}`) })
