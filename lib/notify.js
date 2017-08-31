const Promise = require('bluebird');
const twilio = require('twilio');

const twilioClient = new twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const mailgunClient = require('mailgun-js')({
  apiKey: process.env.MAILGUN_KEY,
  domain: process.env.MAILGUN_DOMAIN
});
const mailgunSender = `Mapkins Admin <${process.env.MAILGUN_SENDER}>`;

const user = require('./user');
const status = require('./status');

function getEmailCopyByContactCase(contactCase) {
  switch (contactCase) {
    case 'electron_offline':
      return 'Electron is offline!';
      break;
    case 'mapkins_out':
      return 'Mapkin machine is out!';
      break;
    case 'mapkins_low':
      return 'Mapkin machine is low!';
      break;
    default:
      return null;
  }
}

function asyncGetAdmins() {
  return new Promise((resolve, reject) => {
    if (!!process.env.ADMINS && process.env.ADMINS.length > 0) {
      const admins = process.env.ADMINS.split(',');
      resolve(admins);
    } else {
      reject(new Error('null admins'));
    }
  });
}

function asyncContactAdmin(email, message) {
  return new Promise((resolve, reject) => {
    const data = {
      from: mailgunSender,
      to: email,
      subject: `Mapkins update: ${message}`,
      text: `Mapkins update: ${message}`
    };

    mailgunClient.messages().send(data, (err, body) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

function asyncContactAdmins(contactCase) {
  return new Promise((resolve, reject) => {
    const emailCopy = getEmailCopyByContactCase(contactCase);
    asyncGetAdmins()
      .then(admins => {
        if (!!admins && admins.length > 0) {
          const promises = [];

          admins.forEach(admin => {
            promises.push(asyncContactAdmin(admin, emailCopy));
          });

          Promise.all(promises)
            .then(promiseResults => {
              resolve();
            })
            .catch(err => {
              reject(err);
            });
        } else {
          reject(new Error('null admins'));
        }
      })
      .catch(err => {
        reject(err);
      });
  });
}

function contactAdminsIfElectronIsOffline() {
  status
    .asyncCheckIfElectronIsConnected()
    .then(res => {
      if (res === false) {
        // mailgun
        asyncContactAdmins('electron_offline')
          .then(() => {
            console.log('Notified admins of electron disconnected');
          })
          .catch(err => {
            console.log(err);
          });
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
