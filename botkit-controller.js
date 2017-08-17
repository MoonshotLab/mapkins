const TwilioSMSBot = require('botkit-sms');
const path = require('path');
const moment = require('moment');

const controller = TwilioSMSBot({
  account_sid: process.env.TWILIO_ACCOUNT_SID,
  auth_token: process.env.TWILIO_AUTH_TOKEN,
  twilio_number: process.env.TWILIO_NUMBER,
  json_file_store: '/tmp/data/conversation/'
});
const bot = controller.spawn({});

module.exports = function(app) {
  controller.createWebhookEndpoints(app, bot, function() {
    controller.startTicking();
    console.log('TwilioSMSBot is online!');
  });

  controller.hears(['hello'], 'message_received', (bot, message) => {
    bot.reply(message, 'Hello!');
  });

  controller.hears('.*', 'message_received', (bot, message) => {
    bot.reply(message, `¯\_(ツ)_/¯`);
  });
};
