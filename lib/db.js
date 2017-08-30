const Promise = require('bluebird');
const low = require('lowdb');
const moment = require('moment');

const config = require('./config');

function asyncInit() {
  return new Promise((resolve, reject) => {
    console.log('Initting DB');
    const db = low(config.dbFile);
    db
      .defaults({
        mapkins_left: { val: config.totalMapkins, timestamp: moment() },
        waitlist: [],
        total_dispensed: 0
      })
      .write();
    resolve();
  });
}

function initIfNecessary() {
  const db = low(config.dbFile).value();
  if (!!db && Object.keys(db).length > 0) {
    console.log('DB already exists:');
    console.log(db);
  } else {
    asyncInit().catch(err => {
      console.log('Error initting DB:', err);
    });
  }
}

function asyncResetMapkinsCount() {
  return new Promise((resolve, reject) => {
    db.get('mapkins_left').assign({ val: config.totalMapkins }).write();
    resolve();
  });
}

module.exports = {
  initIfNecessary: initIfNecessary,
  asyncResetMapkinsCount: asyncResetMapkinsCount
};
