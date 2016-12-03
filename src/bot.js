import botBuilder from 'claudia-bot-builder'
const fbTemplate = botBuilder.fbTemplate

console.log('Bot started.')

export default botBuilder(function(message) {
  console.log('got msg: ' + message.text)

  return message

  return 'Got you! You wrote ' + message.text + ' and extra 🦄'
})
