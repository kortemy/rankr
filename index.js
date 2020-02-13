const http = require('http')
const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const app = express()
const slack = require('./slack')
const port = process.env.PORT || 5000

app.use(cors())
app.use(bodyParser.json({ limit: '3mb' }))
app.use(bodyParser.urlencoded({ extended: true, limit: '3mb' }))

app.get('/', (req, res) => res.send('OK'))
app.post('/queue', async (req, res) => {
  try {
    console.log(req.body)
    let [ period, unit ] = req.body.text.split(' ')

    if (!['minutes', 'hours', 'hour', 'days', 'day', 'week', 'weeks', 'month', 'months', undefined].includes(unit)) {
      res.send(`:no_mouth: Yeah, I can't figure out that time period: *${req.body.text}*`)
      return
    }
    slack(Number(period) || 7, unit || 'days', req.body.channel_id)

    res.send(':point_up: Okay, give me a second...')
  } catch (e) {
    console.trace(e)
    res.status(500)
    res.send()
  }
})

let server = http.createServer(app)

server.listen(port, () => { console.log(`Rankr running on port ${port}`) })
