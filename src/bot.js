import botBuilder from 'claudia-bot-builder'

export default botBuilder(function(message) {
  console.info('got msg: ' + message.text)

  return 'Got you! You wrote ' + message.text
})
