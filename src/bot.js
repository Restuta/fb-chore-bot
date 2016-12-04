import os from 'os'
import ClaudiaBotBuilder from 'claudia-bot-builder'

import chalk from 'chalk'

const FbTemplate = ClaudiaBotBuilder.fbTemplate

const botBrain = controller => {
  controller.on('facebook_optin', (bot, message) => {

    bot.reply(message, 'Hi, I will make sure you never miss your chores. Just type something like "remind me to buy milk tomorrow" to get started.');
  });

  controller.hears(['test'], 'message_received', (bot, message) => {
    bot.reply(message, 'scheduled in 5s')

    setTimeout(() => {
      bot.startConversation(message, (err, convo) => {
        convo.say('Please buy milk')
        console.info(chalk.blue('hey bots'))

        const reply = new FbTemplate.Text('Is it done?')
          .addQuickReply('Yes', 'yes')
          .addQuickReply('No', 'no')
          .get()

        convo.ask(reply, [{
          pattern: 'yes|no',
          callback: (response, convo) => {
            convo.say('ok')
            convo.next()
          }
        }, {
          default: true,
          callback: (response, convo) => {
            convo.say(`Sorry, I didn't get it, yes or no?`)
            convo.repeat()
            convo.next()
          }
        }])

        // convo.ask(reply, (response, convo) => {
        //
        //   if(response.text.toLocaleLowerCase() === 'yes' || response.text === 'no') {
        //     convo.say('got it')
        //   } else {
        //     convo.say('sorry, I didnt get it')
        //     convo.repeat()
        //   }
        //
        //   convo.next()
        // })
      })
    }, 2000)
  })

  controller.hears(['remind me (.*)'], (bot, message) => {
    bot.startConversation(message, (err, convo) => {
      const whenToRemind = new FbTemplate.Text(`When do you want me to remind you "${message.text}"?`)
        .addQuickReply('Later Today')
        .addQuickReply('Tomorrow')
        .addQuickReply('Next Week')
        .get()

      convo.say(whenToRemind, (response, convo) => {
        convo.say(`Ok, will remind you ${response.text} 🙌`)
      })
    })
  })



  controller.hears(['quick'], 'message_received', (bot, message) => {

    bot.reply(message, {
      text: 'Hey! This message has some quick replies attached.',
      quick_replies: [
        {
          "content_type": "text",
          "title": "Yes",
          "payload": "yes"
        }, {
          "content_type": "text",
          "title": "No",
          "payload": "no"
        }
      ]
    });

  });

  controller.hears([
    'hello', 'hi'
  ], 'message_received', (bot, message) => {
    controller.storage.users.get(message.user, (err, user) => {
      if (user && user.name) {
        bot.reply(message, 'Hello ' + user.name + '!!');
      } else {
        bot.reply(message, 'Hello.');
      }
    });
  });

  controller.hears(['silent push reply'], 'message_received', (bot, message) => {
    reply_message = {
      text: "This message will have a push notification on a mobile phone, but no sound notification",
      notification_type: "SILENT_PUSH"
    }
    bot.reply(message, reply_message)
  })

  controller.hears(['no push'], 'message_received', (bot, message) => {
    reply_message = {
      text: "This message will not have any push notification on a mobile phone",
      notification_type: "NO_PUSH"
    }
    bot.reply(message, reply_message)
  })

  // controller.hears(['structured'], 'message_received', (bot, message) => {
  //
  //   bot.startConversation(message, (err, convo) => {
  //     convo.ask({
  //       attachment: {
  //         'type': 'template',
  //         'payload': {
  //           'template_type': 'generic',
  //           'elements': [
  //             {
  //               'title': 'Classic White T-Shirt',
  //               'image_url': 'http://petersapparel.parseapp.com/img/item100-thumb.png',
  //               'subtitle': 'Soft white cotton t-shirt is back in style',
  //               'buttons': [
  //                 {
  //                   'type': 'web_url',
  //                   'url': 'https://petersapparel.parseapp.com/view_item?item_id=100',
  //                   'title': 'View Item'
  //                 }, {
  //                   'type': 'web_url',
  //                   'url': 'https://petersapparel.parseapp.com/buy_item?item_id=100',
  //                   'title': 'Buy Item'
  //                 }, {
  //                   'type': 'postback',
  //                   'title': 'Bookmark Item',
  //                   'payload': 'White T-Shirt'
  //                 }
  //               ]
  //             }, {
  //               'title': 'Classic Grey T-Shirt',
  //               'image_url': 'http://petersapparel.parseapp.com/img/item101-thumb.png',
  //               'subtitle': 'Soft gray cotton t-shirt is back in style',
  //               'buttons': [
  //                 {
  //                   'type': 'web_url',
  //                   'url': 'https://petersapparel.parseapp.com/view_item?item_id=101',
  //                   'title': 'View Item'
  //                 }, {
  //                   'type': 'web_url',
  //                   'url': 'https://petersapparel.parseapp.com/buy_item?item_id=101',
  //                   'title': 'Buy Item'
  //                 }, {
  //                   'type': 'postback',
  //                   'title': 'Bookmark Item',
  //                   'payload': 'Grey T-Shirt'
  //                 }
  //               ]
  //             }
  //           ]
  //         }
  //       }
  //     }, (response, convo) => {
  //       // whoa, I got the postback payload as a response to my convo.ask!
  //       convo.next();
  //     });
  //   });
  // });

  controller.on('facebook_postback', (bot, message) => {
    bot.reply(message, 'Great Choice!!!! (' + message.payload + ')');
  });

  controller.on('tick', (bot, event) => {});

  controller.hears([
    'call me (.*)', 'my name is (.*)'
  ], 'message_received', (bot, message) => {
    var name = message.match[1];
    controller.storage.users.get(message.user, (err, user) => {
      if (!user) {
        user = {
          id: message.user
        };
      }
      user.name = name;
      controller.storage.users.save(user, (err, id) => {
        bot.reply(message, 'Got it. I will call you ' + user.name + ' from now on.');
      });
    });
  });

  controller.hears([
    'what is my name', 'who am i'
  ], 'message_received', (bot, message) => {
    controller.storage.users.get(message.user, (err, user) => {
      if (user && user.name) {
        bot.reply(message, 'Your name is ' + user.name);
      } else {
        bot.startConversation(message, (err, convo) => {
          if (!err) {
            convo.say('I do not know your name yet!');
            convo.ask('What should I call you?', (response, convo) => {
              convo.ask('You want me to call you `' + response.text + '`?', [
                {
                  pattern: 'yes',
                  callback: (response, convo) => {
                    // since no further messages are queued after this,
                    // the conversation will end naturally with status == 'completed'
                    convo.next();
                  }
                }, {
                  pattern: 'no',
                  callback: (response, convo) => {
                    // stop the conversation. this will cause it to end with status == 'stopped'
                    convo.stop();
                  }
                }, {
                  default: true,
                  callback: (response, convo) => {
                    convo.repeat();
                    convo.next();
                  }
                }
              ]);

              convo.next();

            }, {'key': 'nickname'}); // store the results in a field called nickname

            convo.on('end', convo => {
              if (convo.status == 'completed') {
                bot.reply(message, 'OK! I will update my dossier...');

                controller.storage.users.get(message.user, (err, user) => {
                  if (!user) {
                    user = {
                      id: message.user
                    };
                  }
                  user.name = convo.extractResponse('nickname');
                  controller.storage.users.save(user, (err, id) => {
                    bot.reply(message, 'Got it. I will call you ' + user.name + ' from now on.');
                  });
                });

              } else {
                // this happens if the conversation ended prematurely for some reason
                bot.reply(message, 'OK, nevermind!');
              }
            });
          }
        });
      }
    });
  });

  controller.hears(['shutdown'], 'message_received', (bot, message) => {
    bot.startConversation(message, (err, convo) => {

      convo.ask('Are you sure you want me to shutdown?', [
        {
          pattern: bot.utterances.yes,
          callback: (response, convo) => {
            convo.say('Bye!');
            convo.next();
            setTimeout(function() {
              process.exit();
            }, 3000);
          }
        }, {
          pattern: bot.utterances.no,
          default: true,
          callback: (response, convo) => {
            convo.say('*Phew!*');
            convo.next();
          }
        }
      ]);
    });
  });

  controller.hears([
    'uptime', 'identify yourself', 'who are you', 'what is your name'
  ], 'message_received', (bot, message) => {

    var hostname = os.hostname();
    var uptime = formatUptime(process.uptime());

    bot.reply(message, ':|] I am a bot. I have been running for ' + uptime + ' on ' + hostname + '.');
  });

  controller.on('message_received', (bot, message) => {
    bot.reply(message, 'Try "remind me to by milk tomorrow"');
    return false;
  });
}

function formatUptime(uptime) {
  var unit = 'second';
  if (uptime > 60) {
    uptime = uptime / 60;
    unit = 'minute';
  }
  if (uptime > 60) {
    uptime = uptime / 60;
    unit = 'hour';
  }
  if (uptime != 1) {
    unit = unit + 's';
  }

  uptime = uptime + ' ' + unit;
  return uptime;
}

export default botBrain
