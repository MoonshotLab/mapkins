const low = require('lowdb');
const moment = require('moment');
const axios = require('axios');
const qs = require('qs');

const mapkinsPerRow = 10;
const numRows = 5;

const dbFile = 'db.json';
const requestTimeout = 30 * 1000; //ms
const particleUrl = `https://api.particle.io/v1/devices/${process.env
  .PARTICLE_DEVICE_ID}/dispense`;
const particleHeaders = {
  'Content-Type': 'application/x-www-form-urlencoded'
};

function asyncNotifyAdminsOfMapkinsOut() {
  return new Promise((resolve, reject) => {
    // mailgun!
    resolve();
  });
}

function asyncDecrementMapkins() {
  return new Promise((resolve, reject) => {
    asyncGetMapkinsLeft()
      .then(mapkinsLeft => {
        const db = low(dbFile);

        db
          .set('mapkins_left', {
            val: mapkinsLeft - 1,
            timestamp: moment()
          })
          .write();

        resolve();
      })
      .catch(err => {
        reject(err);
      });
  });
}

function asyncMakeSureThereAreMapkinsLeft() {
  return new Promise((resolve, reject) => {
    asyncGetMapkinsLeft().then(mapkinsLeft => {
      if (mapkinsLeft > 0) {
        resolve();
      } else {
        reject(new Error('mapkins_out'));
      }
    });
  });
}

function asyncGetMapkinsLeft() {
  return new Promise((resolve, reject) => {
    asyncGetMapkinsLeftObj()
      .then(mapkinsLeftObj => {
        resolve(mapkinsLeftObj.val);
      })
      .catch(err => {
        reject(err);
      });
  });
}

function asyncGetMapkinsLeftObj() {
  return new Promise((resolve, reject) => {
    const db = low(dbFile);
    const mapkinsLeft = db.get('mapkins_left').value();
    resolve(mapkinsLeft);
  });
}

function asyncGetCurrentStepper() {
  return new Promise((resolve, reject) => {
    asyncGetMapkinsLeft()
      .then(mapkinsLeft => {
        const currentStepper = Math.ceil(mapkinsLeft / mapkinsPerRow);

        console.log('Mapkins left:', mapkinsLeft);
        console.log('Current stepper:', currentStepper);

        if (currentStepper <= 0) {
          reject(new Error('mapkins_out'));
        } else if (currentStepper > numRows) {
          reject(new Error('invalid_stepper'));
        } else {
          resolve(currentStepper);
        }
      })
      .catch(err => {
        reject(err);
      });
  });
}

function asyncHandleDispensingError(error) {
  return new Promise((resolve, reject) => {
    console.log(error);
    if (!!error && !!error.message) {
      switch (error.message) {
        case 'mapkins_out':
          return asyncHandleMapkinsOutError(error);
          break;
        case 'invalid_stepper':
          break;
        default:
          console.log(`Unhandled error: ${error.message}`);
      }
    } else {
      reject(error);
    }
    resolve(false);
  });
}

function asyncDispenseMapkin() {
  return new Promise((resolve, reject) => {
    asyncGetCurrentStepper()
      .then(currentStepper => {
        return axios({
          method: 'POST',
          url: particleUrl,
          data: qs.stringify({
            access_token: process.env.PARTICLE_TOKEN,
            stepper: currentStepper
          }),
          timeout: requestTimeout,
          headers: particleHeaders
        });
      })
      .then(() => {
        return asyncDecrementMapkins();
      })
      .then(() => {
        resolve();
      })
      .catch(err => {
        console.log('Error dispensing mapkin:');
        console.log(err.message);
        console.log(err);

        reject(new Error('error_dispensing_mapkin'));
      });
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

function asyncCompletelyResetDb() {
  return new Promise((resolve, reject) => {
    const db = low(dbFile);
    db
      .defaults({
        mapkins_left: { val: mapkinsPerRow * numRows, timestamp: moment() },
        waitlist: []
      })
      .write();
    resolve();
  });
}

function asyncResetMapkinsCount() {
  return new Promise((resolve, reject) => {
    const db = low(dbFile);
    const waitlist = db.get('waitlist').value();

    db
      .defaults({
        mapkins_left: { val: mapkinsPerRow * numRows, timestamp: moment() },
        waitlist: []
      })
      .write();

    if (!!waitlist && waitlist.length > 0) {
      for (let i = 0; i < waitlist.length; i++) {
        db.get('waitlist').push(waitlist[i]).write();
      }
    }

    resolve();
  });
}

function init() {
  asyncCompletelyResetDb();
}

function getDb() {
  return low(dbFile);
}

module.exports = {
  init: init,
  asyncCompletelyResetDb: asyncCompletelyResetDb,
  asyncResetMapkinsCount: asyncResetMapkinsCount,
  db: getDb(),
  asyncDispenseMapkin: asyncDispenseMapkin,
  asyncAddUserToWaitList: asyncAddUserToWaitList,
  asyncMakeSureThereAreMapkinsLeft: asyncMakeSureThereAreMapkinsLeft,
  asyncNotifyAdminsOfMapkinsOut: asyncNotifyAdminsOfMapkinsOut
};
