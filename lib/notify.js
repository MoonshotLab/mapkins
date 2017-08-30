const Promise = require('bluebird');

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

module.exports = {
  asyncNotifyAdminsOfMapkinsOut: asyncNotifyAdminsOfMapkinsOut,
  asyncNotifyAdminsOfLowMapkinCount: asyncNotifyAdminsOfLowMapkinCount
};
