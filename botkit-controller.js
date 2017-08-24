const TwilioSMSBot = require('botkit-sms');
const path = require('path');
const moment = require('moment');
const axios = require('axios');
const qs = require('qs');
const Promise = require('bluebird');

const requestTimeout = 5 * 1000; //ms

const particleUrl = `https://api.particle.io/v1/devices/${process.env
  .PARTICLE_DEVICE_ID}/led`;
const particleHeaders = {
  'Content-Type': 'application/x-www-form-urlencoded'
};

const controller = TwilioSMSBot({
  account_sid: process.env.TWILIO_ACCOUNT_SID,
  auth_token: process.env.TWILIO_AUTH_TOKEN,
  twilio_number: process.env.TWILIO_NUMBER,
  json_file_store: '/tmp/data/conversation'
});
const bot = controller.spawn({});

function asyncTurnOnLED(status = true) {
  const arg = status === false ? 'off' : 'on';

  return new Promise((resolve, reject) => {
    axios({
      method: 'POST',
      url: particleUrl,
      data: qs.stringify({
        access_token: process.env.PARTICLE_TOKEN,
        arg: arg
      }),
      timeout: requestTimeout,
      headers: particleHeaders
    })
      .then(res => {
        resolve(res);
      })
      .catch(err => {
        reject(err);
      });
  });
}

function asyncTurnOffLED() {
  return asyncTurnOnLED(false);
}

module.exports = function(app) {
  controller.createWebhookEndpoints(app, bot, () => {
    controller.startTicking();
    console.log('TwilioSMSBot is online!');
  });

  controller.hears(['run'], 'message_received', (bot, message) => {
    asyncTurnOnLED()
      .then(() => {
        bot.reply(message, 'Turned LED on.');
        return Promise.delay(5 * 1000);
      })
      .then(() => {
        return asyncTurnOffLED();
      })
      .then(() => {
        bot.reply(message, 'Turned LED off.');
      })
      .catch(err => {
        console.log(err);
        bot.reply(message, 'Something went wrong!');
      });
  });

  controller.hears('.*', 'message_received', (bot, message) => {
    bot.reply(message, `¯\\_(ツ)_/¯`);
  });
};
