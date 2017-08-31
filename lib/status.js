const Promise = require('bluebird');
const moment = require('moment');
const low = require('lowdb');

const Particle = require('particle-api-js');
const particle = new Particle();

const config = require('./config');
const notify = require('./notify');
const util = require('./util');

function asyncGetElectronLastHeard() {
  return new Promise((resolve, reject) => {
    particle
      .getDevice({
        deviceId: process.env.PARTICLE_DEVICE_ID,
        auth: process.env.PARTICLE_TOKEN
      })
      .then(device => {
        resolve(device.body.last_heard);
      })
      .catch(err => {
        reject(err);
      });
  });
}

// resolves false if electron isn't connected
function asyncCheckIfElectronIsConnected() {
  return new Promise((resolve, reject) => {
    asyncMakeSureElectronIsConnected()
      .then(() => {
        resolve(true);
      })
      .catch(err => {
        resolve(false);
      });
  });
}

// rejects if electron isn't connected
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
            const lastHeard = moment(device.body.last_heard);
            const msDifference = util.getHoursFromMs(moment().diff(lastHeard));
            if (msDifference > 1) {
              // it's been more than an hour, not connected
              reject(new Error('electron_not_connected'));
            } else {
              console.log('Electron is connected');
              resolve();
            }
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
    const totalDispensed = db.get('total_dispensed').value();
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
    asyncGetMapkinsLeft()
      .then(mapkinsLeft => {
        if (mapkinsLeft > 0) {
          if (
            mapkinCountIsLow(mapkinsLeft) === true &&
            (mapkinsLeft % 5 === 0 || mapkinsLeft <= 5)
          ) {
            resolve({ low: true });
          } else {
            resolve({ low: false });
          }
        } else {
          reject(new Error('mapkins_out'));
        }
      })
      .catch(err => {
        reject(new Error('mapkins_out'));
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
  asyncIncrementMapkinsDispensed: asyncIncrementMapkinsDispensed,
  asyncCheckIfElectronIsConnected: asyncCheckIfElectronIsConnected,
  asyncGetElectronLastHeard: asyncGetElectronLastHeard
};
