const Promise = require('bluebird');
const twilio = require('twilio');
const moment = require('moment');

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

function foo() {
  console.log('foo');
}

function asyncGetMapkinsLowEmailCopy() {
  return new Promise((resolve, reject) => {
    status
      .asyncGetMapkinsLeft()
      .then(mapkinsLeft => {
        resolve({
          subject: 'Mapkins: Machine is low!',
          message: `Machine is low! There are ${mapkinsLeft} Mapkins left. Refill soon.`
        });
      })
      .catch(err => {
        console.log('Error getting ampkins low copy', err);
        resolve({
          subject: 'Mapkins: Machine is low!',
          message: 'Machine is low! Refill soon.'
        });
      });
  });
}

function asyncGetElectronOfflineEmailCopy() {
  return new Promise((resolve, reject) => {
    status
      .asyncGetElectronLastHeard()
      .then(lastHeard => {
        const momentLastHeard = moment(lastHeard);
        const formattedLastHeard = momentLastHeard.format(
          'MMMM Do YYYY, h:mm:ss a'
        );
        resolve({
          subject: 'Mapkins: Electron Offline',
          message: `Electron is offline. Last heard from ${formattedLastHeard}. Machine is not functional. Make sure it is powered and breathing white light (not fast blinking). See https://docs.particle.io/support/troubleshooting/troubleshooting-support/electron/ for more info.`
        });
      })
      .catch(err => {
        console.log('Error getting electron email copy', err);
        resolve({
          subject: 'Mapkins: Electron Offline',
          message:
            'Electron is offline. Machine is not functional. Make sure it is powered and breathing white light (not fast blinking). See https://docs.particle.io/support/troubleshooting/troubleshooting-support/electron/ for more info.'
        });
      });
  });
}

function asyncGetEmailCopyByContactCase(contactCase) {
  switch (contactCase) {
    case 'electron_offline':
      return asyncGetElectronOfflineEmailCopy();
    case 'mapkins_out':
      return Promise.resolve({
        subject: 'Mapkins: Mapkin machine is out!',
        message: 'Mapkin machine is out!'
      });
    case 'mapkins_low':
      return asyncGetMapkinsLowEmailCopy();
    default:
      return Promise.reject(new Error('unknown_contact_case'));
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

function asyncContactAdmin(emailRecipient, emailObj) {
  return new Promise((resolve, reject) => {
    const data = {
      from: mailgunSender,
      to: emailRecipient,
      subject: emailObj.subject,
      text: emailObj.message
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
    asyncGetEmailCopyByContactCase(contactCase)
      .then(emailCopy => {
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
      })
      .catch(err => {
        reject(err);
      });
  });
}

function contactAdminsIfElectronIsOffline() {
  status
    .asyncCheckIfElectronIsConnected()
    .then(electronIsOnline => {
      if (electronIsOnline === false) {
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
    asyncContactAdmins('mapkins_out')
      .then(() => {
        console.log('Notified admins of mapkins out');
        resolve();
      })
      .catch(err => {
        reject(err);
      });
  });
}

function asyncNotifyAdminsOfLowMapkinCount(count) {
  return new Promise((resolve, reject) => {
    asyncContactAdmins('mapkins_low')
      .then(() => {
        console.log('Notified admins of mapkins low');
        resolve();
      })
      .catch(err => {
        reject(err);
      });
  });
}

function asyncNotifyUserOfRefill(waitlistUser) {
  return new Promise((resolve, reject) => {
    twilioClient.messages
      .create({
        body: `Come and get it! The BBQ Mapkin Machine is restocked and ready for you stop by.`,
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
  foo: foo,
  asyncNotifyAdminsOfMapkinsOut: asyncNotifyAdminsOfMapkinsOut,
  asyncNotifyAdminsOfLowMapkinCount: asyncNotifyAdminsOfLowMapkinCount,
  asyncNotifyEveryoneOnWaitlistOfRefill: asyncNotifyEveryoneOnWaitlistOfRefill,
  contactAdminsIfElectronIsOffline: contactAdminsIfElectronIsOffline
};
