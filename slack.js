const Promise = require('bluebird')
const moment = require('moment')
const request = require('request')
const { WebClient } = require('@slack/web-api')

const BOTTOKEN = 'xoxb-16384980435-949160001157-rWIhPV7FbA6uAWHXzKBJ8ari'

async function execute (params) {
  console.log(params)
  let client = new WebClient(BOTTOKEN)

  let channels = await client.conversations.list({
    token: params.token
  })

  let data = await Promise.reduce(channels, async (result, channel) => {
    let history = await client.conversations.history({
      token: params.token,
      channel: channel.id,
      // oldest: moment().subtract(7, 'days').unix()
    })
    history.forEach(message => {
      if (!message.reactions) {
        return
      }
      let user = result[message.user] || { id: message.user, total: 0, reactions: {} }
      message.reactions.forEach(reaction => {
        let count = user[reaction.name] || 0
        count += reaction.count
        user.reactions[reaction.name] = { total: count }
        user.total += count
      })
      result[message.user] = user
    })
    return result
  }, {})

  let users = Object.values(data)

  const sorter = (a, b) => b.total - a.total

  users.forEach(user => {
    user.reactions = Object.values(user.reactions).sort(sorter)
  })

  let rankings = users.sort(sorter)

  console.log(rankings)

  request(params.response_url, {
    method: 'post',
    formData: {
      text: 'Lalalalala'
    }
  })
}

module.exports = execute