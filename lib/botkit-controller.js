const TwilioSMSBot = require('botkit-sms');
const path = require('path');
const moment = require('moment');
const Promise = require('bluebird');
const axios = require('axios');

const dispense = require('./dispense');

const controller = TwilioSMSBot({
  account_sid: process.env.TWILIO_ACCOUNT_SID,
  auth_token: process.env.TWILIO_AUTH_TOKEN,
  twilio_number: process.env.TWILIO_NUMBER,
  json_file_store: './tmp/data/conversation'
});
const bot = controller.spawn({});

function asyncMakeDispenseCall() {
  return new Promise((resolve, reject) => {
    axios({
      url: `${process.env.SITE_URL}/dispense`,
      method: 'POST',
      data: {
        secret: process.env.SECRET
      }
    })
      .then(res => {
        resolve(res);
      })
      .catch(err => {
        reject(err);
      });
  });
}

function asyncSaveUserById(id) {
  return new Promise((resolve, reject) => {
    controller.storage.users.save({ id: id, mapkin: true }, err => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

function checkIfUserIsInDb(id) {
  try {
    controller.storage.users.get(id, (err, user_data) => {
      if (err) {
        console.log(err);
        return false;
      } else {
        if (!!user_data && user_data.mapkin === true) {
          console.log('returning true');
          return true;
        } else {
          console.log('returning false');
          return false;
        }
      }
    });
  } catch (e) {
    console.log(e);
    return false;
  }
}

function asyncDispenseMapkin(bot, message) {
  return new Promise((resolve, reject) => {
    // TODO: MAKE SURE THIS WORKS
    if (checkIfUserIsInDb(message.user) === true) {
      reject(new Error('user already in DB!'));
    } else {
      asyncSaveUserById(message.user)
        .then(() => {
          return asyncMakeDispenseCall();
        })
        .then(() => {
          bot.reply(
            message,
            `You got a Mapkin. Sweet! So, where to first? Wherever you choose, be sure to tag us using #KCLoves.
          `
          );
          resolve();
        })
        .catch(err => {
          if (
            !!err.response &&
            !!err.response.data &&
            err.response.data.message === 'out'
          ) {
            dispense
              .asyncAddUserToWaitList(message.user)
              .then(() => {
                console.log(`${message.user} successfully added to waitlist.`);
                bot.reply(
                  message,
                  `*womp*womp* We’re out of Mapkins. But don’t worry. We’ll let you know when the next batch is ready.`
                );
              })
              .catch(err => {
                if (err.message === 'already_on_list') {
                  bot.reply(
                    message,
                    `You're already on our wait list and we will let you know when the machine is back in working order. Sorry about that!`
                  );
                } else {
                  console.log(err);
                  bot.reply(
                    message,
                    `Oops! Something went wrong. We are on it and will follow up when the machine is back in working order!`
                  );
                }
              });
          } else {
            console.log('nope');
            bot.reply(
              message,
              `Oops! Something went wrong. We are on it and will follow up when the machine is back in working order!`
            );
          }
          reject(err);
        });
    }
  });
}

function asyncResetUserById(id) {
  return new Promise((resolve, reject) => {
    controller.storage.users.save({ id: id, mapkin: false }, err => {
      if (err) {
        console.log('Error saving user:', err);
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

module.exports = function(app) {
  controller.createWebhookEndpoints(app, bot, () => {
    controller.startTicking();
    console.log('TwilioSMSBot is online!');
  });

  controller.hears(['mapkin'], 'message_received', (bot, message) => {
    asyncDispenseMapkin(bot, message)
      .then(() => {
        console.log('success');
      })
      .catch(err => {
        try {
          if (!!err.response.data.message) {
            console.log(`Error: ${err.response.data.message}`);
          }
        } catch (e) {
          console.log('Something went wrong!');
          console.log(err);
        }
      });
  });

  controller.hears('.*', 'message_received', (bot, message) => {
    bot.reply(message, `¯\\_(ツ)_/¯`);
  });
};
