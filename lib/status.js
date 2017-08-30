const Promise = require('bluebird');
const moment = require('moment');
const low = require('lowdb');

const Particle = require('particle-api-js');
const particle = new Particle();

const config = require('./config');
const notify = require('./notify');

function foo() {
  console.log('foo!');
}

function asyncMakeSureElectronIsConnected() {
  return new Promise((resolve, reject) => {
    particle
      .getDevice({
        deviceId: process.env.PARTICLE_DEVICE_ID,
        auth: process.env.PARTICLE_TOKEN
      })
      .then(device => {
        try {
          if (device.body.connected === true) {
            console.log('Electron is connected');
            resolve();
          } else {
            reject(new Error('electron_not_connected'));
          }
        } catch (e) {
          reject(new Error('electron_not_connected'));
        }
      })
      .catch(err => {
        console.log(err);
        reject(new Error('electron_not_connected'));
      });
  });
}

function asyncGetTotalMapkinsDispensed() {
  return new Promise((resolve, reject) => {
    const db = low(config.dbFile);
    const totalDispensed = db.get('totalDispensed').value();
    resolve(totalDispensed);
  });
}

function asyncGetCurrentStepper() {
  return new Promise((resolve, reject) => {
    asyncGetMapkinsLeft()
      .then(mapkinsLeft => {
        const currentStepper = Math.ceil(mapkinsLeft / config.mapkinsPerRow);

        console.log('Mapkins left:', mapkinsLeft);
        console.log('Current stepper:', currentStepper);

        if (currentStepper <= 0) {
          reject(new Error('mapkins_out'));
        } else if (currentStepper > config.numRows) {
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

function mapkinCountIsLow(count) {
  return count <= config.mapkinsLowCount;
}

function asyncCheckIfMapkinCountIsLow() {
  return new Promise((resolve, reject) => {
    asyncGetMapkinsLeft()
      .then(mapkinsLeft => {
        const countIsLow = mapkinCountIsLow(mapkinsLeft);
        resolve(countIsLow);
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
        if (mapkinCountIsLow(mapkinsLeft) === true) {
          notify.asyncNotifyAdminsOfLowMapkinCount(mapkinsLeft).catch(err => {
            console.log('Error notifying admins of low count');
          });
        }

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
    const db = low(config.dbFile);
    const mapkinsLeft = db.get('mapkins_left').value();
    resolve(mapkinsLeft);
  });
}

function asyncIncrementMapkinsDispensed() {
  return new Promise((resolve, reject) => {
    const db = low(config.dbFile);
    const totalDispensed = db.get('total_dispensed').value();

    db.set('total_dispensed', totalDispensed + 1).write();

    resolve();
  });
}

function asyncDecrementMapkinsAvailable() {
  return new Promise((resolve, reject) => {
    asyncGetMapkinsLeft()
      .then(mapkinsLeft => {
        const db = low(config.dbFile);

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

module.exports = {
  asyncGetMapkinsLeft: asyncGetMapkinsLeft,
  asyncGetTotalMapkinsDispensed: asyncGetTotalMapkinsDispensed,
  asyncDecrementMapkinsAvailable: asyncDecrementMapkinsAvailable,
  asyncGetMapkinsLeft: asyncGetMapkinsLeft,
  asyncMakeSureThereAreMapkinsLeft: asyncMakeSureThereAreMapkinsLeft,
  asyncGetTotalMapkinsDispensed: asyncGetTotalMapkinsDispensed,
  asyncGetCurrentStepper: asyncGetCurrentStepper,
  asyncMakeSureElectronIsConnected: asyncMakeSureElectronIsConnected,
  asyncCheckIfMapkinCountIsLow: asyncCheckIfMapkinCountIsLow,
  asyncIncrementMapkinsDispensed: asyncIncrementMapkinsDispensed
};
