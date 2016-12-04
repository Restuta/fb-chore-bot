/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
           ______     ______     ______   __  __     __     ______
          /\  == \   /\  __ \   /\__  _\ /\ \/ /    /\ \   /\__  _\
          \ \  __<   \ \ \/\ \  \/_/\ \/ \ \  _"-.  \ \ \  \/_/\ \/
           \ \_____\  \ \_____\    \ \_\  \ \_\ \_\  \ \_\    \ \_\
            \/_____/   \/_____/     \/_/   \/_/\/_/   \/_/     \/_/


This is a sample Facebook bot built with Botkit.

This bot demonstrates many of the core features of Botkit:

* Connect to Facebook's Messenger APIs
* Receive messages based on "spoken" patterns
* Reply to messages
* Use the conversation system to ask questions
* Use the built in storage system to store and retrieve information
  for a user.

# RUN THE BOT:

  Follow the instructions here to set up your Facebook app and page:

    -> https://developers.facebook.com/docs/messenger-platform/implementation

  Run your bot from the command line:

    page_token=<MY PAGE TOKEN> verify_token=<MY_VERIFY_TOKEN> node facebook_bot.js [--lt [--ltsubdomain LOCALTUNNEL_SUBDOMAIN]]

  Use the --lt option to make your bot available on the web through localtunnel.me.

# USE THE BOT:

  Find your bot inside Facebook to send it a direct message.

  Say: "Hello"

  The bot will reply "Hello!"

  Say: "who are you?"

  The bot will tell you its name, where it running, and for how long.

  Say: "Call me <nickname>"

  Tell the bot your nickname. Now you are friends.

  Say: "who am I?"

  The bot will tell you your nickname, if it knows one for you.

  Say: "shutdown"

  The bot will ask if you are sure, and then shut itself down.

  Make sure to invite your bot into other channels using /invite @<my bot>!

# EXTEND THE BOT:

  Botkit has many features for building cool and useful bots!

  Read all about it here:

    -> http://howdy.ai/botkit

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/

import botBrain from './bot'

if (!process.env.page_token) {
  console.log('Error: Specify page_token in environment');
  process.exit(1);
}

if (!process.env.verify_token) {
  console.log('Error: Specify verify_token in environment');
  process.exit(1);
}

import Botkit from 'botkit'
import commandLineArgs from 'command-line-args'
import localtunnel from 'localtunnel'
import inMemoryStorage from './storage'

const ops = commandLineArgs([
  {
    name: 'lt',
    alias: 'l',
    args: 1,
    description: 'Use localtunnel.me to make your bot available on the web.',
    type: Boolean,
    defaultValue: false
  }, {
    name: 'ltsubdomain',
    alias: 's',
    args: 1,
    description: 'Custom subdomain for the localtunnel.me URL. This option can only be used together with --lt.',
    type: String,
    defaultValue: null
  }
]);

if (ops.lt === false && ops.ltsubdomain !== null) {
  console.log("error: --ltsubdomain can only be used together with --lt.");
  process.exit();
}

var controller = Botkit.facebookbot({
  debug: true,
  access_token: process.env.page_token,
  verify_token: process.env.verify_token,
  // storage: inMemoryStorage()
});

var bot = controller.spawn({});

controller.setupWebserver(process.env.PORT || 3000, function(err, webserver) {
  controller.createWebhookEndpoints(webserver, bot, function() {
    console.log('ONLINE!');

    if (ops.lt) {
      var tunnel = localtunnel(process.env.PORT || 3000, {
        subdomain: ops.ltsubdomain
      }, (err, tunnel) => {
        if (err) {
          console.log(err);
          process.exit();
        }
        console.log("Your bot is available on the web at the following URL: " + tunnel.url + '/facebook/receive');
      });

      tunnel.on('close', () => {
        console.log("Your bot is no longer available on the web at the localtunnnel.me URL.");
        process.exit();
      });
    }
  });
});

botBrain(controller)
