const TwilioSMSBot = require('botkit-sms');
const path = require('path');
const moment = require('moment');
const axios = require('axios');
const qs = require('qs');

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

function asyncTurnOnLED() {
  return axios({
    method: 'POST',
    url: particleUrl,
    data: qs.stringify({
      access_token: process.env.PARTICLE_TOKEN,
      arg: 'on'
    }),
    headers: particleHeaders
  })
    .then(res => {
      console.log(res);
    })
    .catch(err => {
      console.log(err);
    });
}

function asyncTurnOffLED() {
  return axios({
    method: 'POST',
    url: particleUrl,
    data: qs.stringify({
      access_token: process.env.PARTICLE_TOKEN,
      arg: 'off'
    }),
    headers: particleHeaders
  })
    .then(res => {
      console.log(res);
    })
    .catch(err => {
      console.log(err);
    });
}

module.exports = function(app) {
  controller.createWebhookEndpoints(app, bot, () => {
    controller.startTicking();
    console.log('TwilioSMSBot is online!');
  });

  // controller.hears(['run'], 'message_received', (bot, message) => {
  //   asyncTurnOnLED
  //     .then(() => {
  //       bot.reply(message, 'Turning LED on.');
  //       return Promise.delay(500);
  //     })
  //     .then(() => {
  //       return asyncTurnOffLED();
  //     })
  //     .then(() => {
  //       bot.reply(message, 'Turning LED off.');
  //     })
  //     .catch(err => {
  //       bot.reply(message, 'Something went wrong!');
  //     });
  // });

  // controller.hears('.*', 'message_received', (bot, message) => {
  //   console.log(bot, message);
  //   bot.reply(message, 'hello');
  //   // bot.reply(message, `¯\_(ツ)_/¯`);
  // });

  controller.hears(['.*'], 'message_received', (bot, message) => {
    console.log('test');
    bot.reply(message, 'hello');
  });
};
