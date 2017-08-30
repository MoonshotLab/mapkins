const Promise = require('bluebird');
const low = require('lowdb');
const moment = require('moment');
const fs = require('fs');

const config = require('./config');

function asyncInit() {
  return new Promise((resolve, reject) => {
    console.log('Initting DB');
    fs.closeSync(fs.openSync(config.dbFile, 'w')); // create file if it's not there

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
    const db = low(config.dbFile);
    db
      .get('mapkins_left')
      .assign({ val: config.totalMapkins, timestamp: moment() })
      .write();

    console.log(`Mapkin count reset to ${config.totalMapkins}`);
    resolve();
  });
}

module.exports = {
  initIfNecessary: initIfNecessary,
  asyncResetMapkinsCount: asyncResetMapkinsCount
};
