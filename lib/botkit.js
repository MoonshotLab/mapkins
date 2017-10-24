const TwilioSMSBot = require('botkit-sms');
const path = require('path');
const moment = require('moment');
const Promise = require('bluebird');
const axios = require('axios');

const dispense = require('./dispense');
const notify = require('./notify');
const status = require('./status');
const user = require('./user');
const config = require('./config');

const controller = TwilioSMSBot({
  account_sid: process.env.TWILIO_ACCOUNT_SID,
  auth_token: process.env.TWILIO_AUTH_TOKEN,
  twilio_number: process.env.TWILIO_NUMBER,
  json_file_store: config.twilioStore
});
const bot = controller.spawn({});

function asyncMakeDispenseCall() {
  return new Promise((resolve, reject) => {
    axios({
      url: `${process.env.SITE_URL}/dispense`,
      method: 'POST',
      data: {
        secret: process.env.SECRET
      },
      timeout: config.requestTimeout
    })
      .then(res => {
        resolve(res);
      })
      .catch(err => {
        console.log(err);
        reject(err);
      });
  });
}

function asyncSaveUserById(id) {
  return new Promise((resolve, reject) => {
    controller.storage.users.save({ id: id, mapkin: true }, err => {
      if (err) {
        reject(new Error('error_saving_user'));
      } else {
        console.log(`Added user ${id} to DB.`);
        resolve();
      }
    });
  });
}

function asyncCheckIfUserIsInDb(id) {
  return new Promise((resolve, reject) => {
    console.log(`Checking if user ${id} is in db`);
    controller.storage.users.get(id, (err, user_data) => {
      if (err) {
        resolve(false);
      } else {
        if (!!user_data && user_data.mapkin === true) {
          console.log('returning true');
          resolve(true);
        } else {
          console.log('returning false');
          resolve(false);
        }
      }
    });
  });
}

function asyncMakeSureUserIsNew(id) {
  return new Promise((resolve, reject) => {
    controller.storage.users.get(id, (err, user_data) => {
      if (err) {
        resolve();
      } else {
        if (!!user_data && user_data.mapkin === true) {
          reject(new Error('user_is_not_new'));
        } else {
          resolve();
        }
      }
    });
  });
}

function asyncHandleUserNotNewError(bot, message) {
  return new Promise((resolve, reject) => {
    console.log(`Denying mapkin to user already in DB ${message.user}`);
    bot.reply(
      message,
      `Hi there. Nice to hear from ya’ again. But you already got your Mapkin, remember? Nothing personal, but we’re only doing one Mapkin per phone number.`,
      (err, res) => {
        if (err) {
          console.log(err);
        } else {
          console.log(res);
        }
      }
    );

    resolve(false);
  });
}

function asyncHandleElectronNotConnectedError(bot, message) {
  return new Promise((resolve, reject) => {
    console.log('electron not connected!');
    resolve();
  });
}

function asyncHandleMapkinsOutError(bot, message) {
  return new Promise((resolve, reject) => {
    console.log('Mapkins out!');
    notify.asyncNotifyAdminsOfMapkinsOut().catch(err => {
      console.log('Error notifying admins:', err);
    });

    user
      .asyncAddUserToWaitList(message.user)
      .then(() => {
        console.log(`${message.user} successfully added to waitlist.`);
        bot.reply(
          message,
          `*womp*womp* We’re out of Mapkins. But don’t worry. We’ll let you know when the next batch is ready.`
        );
        resolve(false);
      })
      .catch(err => {
        if (err.message === 'already_on_list') {
          console.log(`${message.user} already on waitlist.`);
          bot.reply(
            message,
            `The BBQ Mapkin Machine's still out. But don't worry. You're on our list, and we’ll let you know when we're back with a fresh batch.`
          );
          resolve(false);
        } else {
          reject(err);
        }
      });
  });
}

function asyncHandleGenericError(bot, message) {
  return new Promise((resolve, reject) => {
    bot.reply(
      message,
      `Whoops. Looks like something went wrong. But we're on it and will let you when everything's back in working order!`
    );

    resolve(false);
  });
}

function asyncHandleDispensingError(error, bot, message) {
  return new Promise((resolve, reject) => {
    if (!!error && !!error.message) {
      switch (error.message) {
        case 'user_is_not_new':
          return asyncHandleUserNotNewError(bot, message);
          break;
        case 'mapkins_out':
          return asyncHandleMapkinsOutError(bot, message);
          break;
        case 'electron_not_connected':
          return asyncHandleElectronNotConnectedError(bot, message);
        default:
          console.log(`Unhandled error: ${error.message}`);
          return asyncHandleGenericError(bot, message);
      }
    } else {
      reject(error);
    }
    resolve(false);
  });
}

function asyncDispenseMapkin(bot, message, userSaidPassword = true) {
  return new Promise((resolve, reject) => {
    status
      .asyncMakeSureElectronIsConnected()
      .then(() => {
        return asyncMakeSureUserIsNew(message.user);
      })
      .then(() => {
        return status.asyncMakeSureThereAreMapkinsLeft();
      })
      .then(() => {
        return asyncMakeDispenseCall();
      })
      .then(() => {
        return asyncSaveUserById(message.user);
      })
      .then(() => {
        console.log(`Mapkin dispensed to user ${message.user}`);
        if (userSaidPassword === true) {
          bot.reply(
            message,
            `Got your text! Wait right here and your Mapkin will be served up in just a few seconds. And once you get it, be sure to tag us when you’re out and about using #KCLoves.`,
            (err, res) => {
              if (err) {
                console.log(err);
              } else {
                console.log(res);
              }
            }
          );
        } else {
          bot.reply(
            message,
            `Technically, you didn't say “Mapkin.” But I'm feeling generous, so here you go.`
          );
        }

        status
          .asyncCheckIfMapkinCountIsLow()
          .then(countIsLow => {
            if (countIsLow === true) {
              bot.reply(
                message,
                `Heads up! The BBQ Mapkin Machine is almost empty. So if your friends want to snag a Mapkin they better hurry.`
              );
            }
            resolve(true);
          })
          .catch(err => {
            console.log(
              'Error checking if count is low, but ignoring since we already dispensed succesfully',
              err
            );
            resolve(true);
          });
      })
      .catch(dispensingError => {
        asyncHandleDispensingError(dispensingError, bot, message)
          .then(mapkinDidDispense => {
            resolve(mapkinDidDispense);
          })
          .catch(handlingError => {
            reject(handlingError);
          });
      });
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

exports.controller = controller;
exports.bot = bot;

exports.init = function(app) {
  controller.createWebhookEndpoints(app, bot, () => {
    controller.startTicking();
    console.log('TwilioSMSBot is online!');
  });

  controller.hears(['mapkin'], 'message_received', (bot, message) => {
    asyncDispenseMapkin(bot, message, true).catch(err => {
      console.log('Something went wrong!');
      console.log(err);
    });
  });

  controller.hears('.*', 'message_received', (bot, message) => {
    asyncDispenseMapkin(bot, message, false).catch(err => {
      console.log('Something went wrong!');
      console.log(err);
    });
  });
};
