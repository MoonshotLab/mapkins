const low = require('lowdb');
const moment = require('moment');
const axios = require('axios');
const qs = require('qs');

const mapkinsPerRow = 10;
const numRows = 5;

const dbFile = 'db.json';
const requestTimeout = 15 * 1000; //ms
const particleUrl = `https://api.particle.io/v1/devices/${process.env
  .PARTICLE_DEVICE_ID}/dispense`;
const particleHeaders = {
  'Content-Type': 'application/x-www-form-urlencoded'
};

function asyncDecrementMapkins() {
  return new Promise((resolve, reject) => {
    const db = low(dbFile);

    const mapkinsLeft = getMapkinsLeft();

    db
      .set('mapkins_left', {
        val: mapkinsLeft - 1,
        timestamp: moment()
      })
      .write();
    resolve();
  });
}

function getMapkinsLeft() {
  const mapkinsLeft = getMapkinsLeftObj();
  return mapkinsLeft.val;
}

function getMapkinsLeftObj() {
  const db = low(dbFile);
  const mapkinsLeft = db.get('mapkins_left').value();
  return mapkinsLeft;
}

function getCurrentStepper() {
  const mapkinsLeft = getMapkinsLeft();
  console.log('Mapkins left:', mapkinsLeft);
  const currentStepper = Math.ceil(mapkinsLeft / mapkinsPerRow);
  console.log('Current stepper:', currentStepper);

  if (currentStepper > numRows) {
    return null;
  } else {
    return currentStepper;
  }
}

function asyncDispenseMapkin() {
  return new Promise((resolve, reject) => {
    const currentStepper = getCurrentStepper();

    if (currentStepper <= 0) {
      reject(new Error('out'));
    } else if (currentStepper !== null) {
      console.log(`dispensing to stepper ${currentStepper}`);
      axios({
        method: 'POST',
        url: particleUrl,
        data: qs.stringify({
          access_token: process.env.PARTICLE_TOKEN,
          stepper: currentStepper
        }),
        timeout: requestTimeout,
        headers: particleHeaders
      })
        .then(() => {
          return asyncDecrementMapkins();
        })
        .then(() => {
          resolve();
        })
        .catch(err => {
          reject(err);
        });
    } else {
      console.log('invalid');
      reject(new Error('invalid'));
    }
  });
}

function asyncAddUserToWaitList(id) {
  return new Promise((resolve, reject) => {
    const db = low(dbFile);
    if (!!db.get('waitlist').find({ id: id }).value()) {
      reject(new Error('already_on_list'));
    } else {
      db.get('waitlist').push({ id: id }).write();
      resolve();
    }
  });
}

function asyncResetMapkins() {
  return new Promise((resolve, reject) => {
    const db = low(dbFile);
    db
      .set('mapkins_left')
      .assign({
        val: mapkinsPerRow * numRows,
        timestamp: moment()
      })
      .write();
    resolve();
  });
}

function asyncResetWaitingUsers() {
  return new Promise((resolve, reject) => {
    const db = low(dbFile);
    db.set('waitlist').assign([]).write();
    resolve();
  });
}

function asyncResetDb() {
  return new Promise((resolve, reject) => {
    asyncResetMapkins()
      .then(() => {
        return asyncResetWaitingUsers();
      })
      .then(() => {
        resolve();
      })
      .catch(err => {
        reject(err);
      });
  });
}

function init() {
  const db = low(dbFile);
  db
    .defaults({
      mapkins_left: { val: mapkinsPerRow * numRows, timestamp: moment() },
      waitlist: []
    })
    .write();
}

function getDb() {
  return low(dbFile);
}

module.exports = {
  init: init,
  asyncResetDb: asyncResetDb,
  db: getDb(),
  asyncDispenseMapkin: asyncDispenseMapkin,
  asyncAddUserToWaitList: asyncAddUserToWaitList
};
