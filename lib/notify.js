const Promise = require('bluebird');
const twilio = require('twilio');

const twilioClient = new twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const user = require('./user');
const status = require('./status');

function contactAdminsIfElectronIsOffline() {
  status
    .asyncCheckIfElectronIsConnected()
    .then(res => {
      if (res === false) {
        console.log('Notifying admins of electron disconnected');
        // mailgun
      }
    })
    .catch(err => {
      console.log(err);
    });
}

function asyncNotifyAdminsOfMapkinsOut() {
  return new Promise((resolve, reject) => {
    // mailgun!
    console.log('Notifying admins of mapkins out');
    resolve();
  });
}

function asyncNotifyAdminsOfLowMapkinCount(count) {
  return new Promise((resolve, reject) => {
    // mailgun!
    console.log('Notifying admins of low mapkin count');
    resolve();
  });
}

function asyncNotifyUserOfRefill(waitlistUser) {
  return new Promise((resolve, reject) => {
    twilioClient.messages
      .create({
        body:
          'The Mapkin machine has been refilled! Head over to grab your own.',
        to: waitlistUser.id,
        from: process.env.TWILIO_NUMBER
      })
      .then(() => {
        return user.asyncRemoveUserFromWaitlist(waitlistUser.id);
      })
      .then(() => {
        resolve();
      })
      .catch(err => {
        console.log(err);
        reject(err);
      });
  });
}

function asyncNotifyEveryoneOnWaitlistOfRefill() {
  return new Promise((resolve, reject) => {
    user
      .asyncGetWaitlist()
      .then(waitlist => {
        const promises = [];

        waitlist.forEach(user => {
          promises.push(asyncNotifyUserOfRefill(user));
        });

        Promise.all(promises)
          .then(() => {
            resolve();
          })
          .catch(err => {
            console.log(err);
            reject(err);
          });
      })
      .catch(err => {
        console.log(err);
        reject(err);
      });

    resolve();
  });
}

module.exports = {
  asyncNotifyAdminsOfMapkinsOut: asyncNotifyAdminsOfMapkinsOut,
  asyncNotifyAdminsOfLowMapkinCount: asyncNotifyAdminsOfLowMapkinCount,
  asyncNotifyEveryoneOnWaitlistOfRefill: asyncNotifyEveryoneOnWaitlistOfRefill,
  contactAdminsIfElectronIsOffline: contactAdminsIfElectronIsOffline
};
