import os from 'os'
import ClaudiaBotBuilder from 'claudia-bot-builder'
import chalk from 'chalk'
import { inspect } from './utils'
import { Variations } from './bot-utils'
import moment from 'moment'

const DEBUG = msg => console.log(chalk.blue(msg))
const INSPECT = obj => console.log(inspect(obj))

const FbTemplate = ClaudiaBotBuilder.fbTemplate

const setReminder = (chore, bot, message) => {
  DEBUG(chore.nextReminderAt.toString())
  const remindInMs = chore.nextReminderAt - moment()
  const choreSetRelative = chore.createdAt.fromNow()

  const cancelChore = convo => {
    convo.say('You would have to provide a reason for canceling this chore, free form text.')
    convo.ask('So what is it?', Variations()
      .addDefault((res, convo) => {
        if (res.text.length < 5) {
          convo.say(`Ha ha, nice try, this is not a real reason, let's try one more time.`)
          convo.repeat()
          convo.next()
        } else {
          convo.say(`✍️ noted it down, and Chore is now canceled.`)
          convo.next()
        }
      })
      .get()
    )
    convo.next()
  }

  DEBUG('remind in ms: ' + remindInMs)

  setTimeout(() => {
    bot.startConversation(message, (err, convo) => {
      convo.say(`Reminding "${chore.name}", set ${choreSetRelative}`)

      const isItDone = new FbTemplate.Text('Is it done?')
        .addQuickReply('Yes', 'yes')
        .addQuickReply('No', 'no')
        .addQuickReply('Cancel', 'cancel')
        .get()

      convo.ask(isItDone, Variations()
        .add(bot.utterances.yes, (res, convo) => {
          convo.ask('Please type "done", so I know that you are not lying.', Variations()
            .add('done', (res, convo) => {
              convo.say('Great! 😍')
              convo.next()
            })
            .addDefault((res, convo) => {
              convo.say(`Unfortunately I can't mark task as done so easely, otherwise you will be able to use this as`
                + `a quick escape hatch when I get really annoying. But I have to make sure you really do your chores ¯\_(ツ)_/¯`)

              const reply = new FbTemplate.Text(`If it's not done yet, just do nothing and I will remind you later or: `)
                .addQuickReply('It is really done', 'really done')
                .addQuickReply('Cancel', 'cancel')
                .get()

              convo.ask(reply, Variations()
                .add('really done', (res, convo) => {
                  convo.say('Ok, Great! 😍')
                  convo.next()
                })
                .add('cancel', (res, convo) => {
                  cancelChore(convo)
                })
                .addDefault((res, convo) => {
                  convo.say(`Not sure what do you mean. Let's try one more time.`)
                  convo.repeat()
                  convo.next()
                })
                .get()
              )

              convo.next()
            })
            .get()
          )

          convo.next()
        })
        .add(bot.utterances.no, (res, convo) => {
          convo.say('Hm, ok 😐, will remind you later.')
          convo.next()
        })
        .add('cancel', (res, convo) => {
          cancelChore(convo)
        })
        .addDefault((res, convo) => {
          convo.say(`Sorry, I didn't get it, yes or no?`)
          convo.repeat()
          convo.next()
        })
        .get()
      )
    })
  }, remindInMs)
}

const newChore = ({name, whenToRemind}) => {
  let nextReminderAt = moment()

  switch(whenToRemind.toLocaleLowerCase()) {
    case 'later today':

      nextReminderAt.add(5, 'seconds')
      break
    case 'tomorrow':
      //tomorrow at 9am
      nextReminderAt.add(1, 'day').hours(9).minutes(0)
      break
    case 'next week':
      const dayOfWeek = nextReminderAt.day()
      const daysToNextMonday = (7 - dayOfWeek) + 1
      //next monday at 10am (so it doesn't interfere with 9am reminders)
      nextReminderAt.add(daysToNextMonday, 'days')
        .hours(10).minutes(0)
      break
    default:
      nextReminderAt.add(1, 'hour')
  }

  return {
    name: name,
    createdAt: moment(),
    nextReminderAt: nextReminderAt,
  }
}

//promises
const getUserData = (controller, message) => {
  DEBUG('message user:')
  INSPECT(message.user)

  return new Promise((resolve, reject) => {
    controller.storage.users.get(message.user, (err, user) => {
      if (err) reject(err)
      if (!user) {
        user = {
          id: message.user,
          chores: []
        }
        //save user if it doesn't exist
        controller.storage.users.save(user, (err, id) => {
          if (err) reject(err)
          resolve(user)
        })
      } else {
        resolve(user)
      }
    })
  })
}

const botBrain = controller => {
  controller.on('facebook_optin', (bot, message) => {
    bot.reply(message, 'Hi, I will make sure you never miss your chores. Just type something like "remind me to buy milk tomorrow" to get started.');
  });

  controller.hears(['list'], 'message_received', (bot, message) => {
    getUserData(controller, message)
      .then(user => {
        if (user.chores.length > 0) {
          bot.reply(message, 'Here is the list of all your chores:');
          setTimeout(() => {
            user.chores.map(chore => {
              const choreSetRelative = chore.createdAt.fromNow()
              bot.reply(message, `"${chore.name}", set ${choreSetRelative}`)
            })
          }, 2000)
        } else {
            bot.reply(message, 'Your list is empty. Create your first chore by typing something like "remind me to by milk"')
        }
      })
  })

  controller.hears(['remind me (.*)'], 'message_received', (bot, message) => {
    const task = message.match[1]

    bot.startConversation(message, (err, convo) => {
      const whenToRemind = new FbTemplate.Text(`When do you want me to remind you "${task}"?`)
        .addQuickReply('Later Today', 'later today')
        .addQuickReply('Tomorrow', 'tomorrow')
        .addQuickReply('Next Week', 'next week')
        .get()

      convo.ask(whenToRemind, Variations()
        .addDefault((response, convo) => {
          getUserData(controller, message)
            .then(user => {
              INSPECT(user)

              const chore = newChore({name: task, whenToRemind: response.text})
              //TODO restuta: get rid of manual mutation, use SAVE instead
              user.chores.push(chore)

              setReminder(chore, bot, message)

              convo.say(`Ok, I'll remind you "${task}" ${response.text} 🙌`)
              convo.next()
            })
        })
        .get()
      )
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

  // controller.hears(['shutdown'], 'message_received', (bot, message) => {
  //   bot.startConversation(message, (err, convo) => {
  //
  //     convo.ask('Are you sure you want me to shutdown?', [
  //       {
  //         pattern: bot.utterances.yes,
  //         callback: (response, convo) => {
  //           convo.say('Bye!');
  //           convo.next();
  //           setTimeout(function() {
  //             process.exit();
  //           }, 3000);
  //         }
  //       }, {
  //         pattern: bot.utterances.no,
  //         default: true,
  //         callback: (response, convo) => {
  //           convo.say('*Phew!*');
  //           convo.next();
  //         }
  //       }
  //     ]);
  //   });
  // });

  controller.hears([
    'uptime', 'identify yourself', 'who are you', 'what is your name'
  ], 'message_received', (bot, message) => {

    var hostname = os.hostname();
    var uptime = formatUptime(process.uptime());

    bot.reply(message, ':|] I am a bot. I have been running for ' + uptime + ' on ' + hostname + '.');
  });

  controller.on('message_received', (bot, message) => {
    bot.reply(message, 'Try somethink like "remind me to by milk tomorrow"');
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
