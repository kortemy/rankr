const Promise = require('bluebird')
const moment = require('moment')
const { WebClient } = require('@slack/web-api')

const BOT_TOKEN = process.env.BOT_TOKEN

module.exports = async function execute (period, unit, channel) {
  let client = new WebClient(BOT_TOKEN)

  let { channels } = await client.conversations.list({
    token: BOT_TOKEN,
  })

  let data = await Promise.reduce(channels, async (result, channel) => {
    await client.conversations.join({
      token: BOT_TOKEN,
      channel: channel.id,
    })

    let messages = []
    let finished = false
    const getPage = async (cursor) => {
      let { messages, response_metadata } = await client.conversations.history({
        token: BOT_TOKEN,
        channel: channel.id,
        oldest: moment().subtract(period, unit).unix(),
        cursor: cursor,
        limit: 100
      })
      finished = !response_metadata.next_cursor
      return { messages, cursor: response_metadata.next_cursor }
    }

    let cursor
    while (!finished) {
      let result = await getPage(cursor)
      cursor = result.cursor
      messages = messages.concat(result.messages)
    }

    messages.forEach(message => {
      if (!message.reactions) {
        return
      }
      let user = result[message.user] || { id: message.user, total: 0, reactions: {} }
      message.reactions.forEach(reaction => {
        user.reactions[reaction.name] = user.reactions[reaction.name] || { name: reaction.name, total: 0 }
        user.reactions[reaction.name].total += reaction.count
        user.total += reaction.count
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

  let blocks = []

  if (rankings.length > 0) {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `:trophy: Here are the rankings for the last *${period} ${unit}*:`,
      }
    })
  
    rankings.forEach((u, i) => {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `#${i + 1} <@${u.id}> - *${u.total}* reactions`,
        }
      })
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: u.reactions.map(r => `${r.total} x :${r.name}:`).join(' | '),
        },
      })
    })
  } else {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `:pensive: No reactions found in the last *${period} ${unit}*:`,
      }
    })
  }

  await client.chat.postMessage({
    channel: channel,
    text: ':trophy: Here are the rankings for the last *1 day*:',
    mrkdwn: true,
    blocks: blocks
  })
}
