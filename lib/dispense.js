const Promise = require('bluebird');
const Particle = require('particle-api-js');
const particle = new Particle();

const notify = require('./notify');
const config = require('./config');
const status = require('./status');

function asyncHandleDispensingError(error) {
  return new Promise((resolve, reject) => {
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
    status
      .asyncGetCurrentStepper()
      .then(currentStepper => {
        return asyncDispenseMapkinToStepper(currentStepper);
      })
      .then(stepper => {
        resolve(stepper);
      })
      .catch(err => {
        if (err.message === 'mapkins_out') {
          notify.asyncNotifyAdminsOfMapkinsOut().finally(() => {
            reject(new Error('error_dispensing_mapkin'));
          });
        } else {
          reject(new Error('error_dispensing_mapkin'));
        }
      });
  });
}

function asyncDispenseMapkinToStepper(stepper) {
  return new Promise((resolve, reject) => {
    const stepperNum = parseInt(stepper);
    if (stepperNum <= 0 || stepperNum > config.numRows) {
      reject(new Error('invalid_stepper_num'));
    } else {
      status
        .asyncMakeSureThereAreMapkinsLeft()
        .then(res => {
          if (res.low === true) {
            return notify.asyncNotifyAdminsOfLowMapkinCount();
          } else {
            return Promise.resolve();
          }
        })
        .then(() => {
          console.log(`Attempting to dispense to stepper ${stepperNum}`);
          return particle.callFunction({
            name: 'dispense',
            deviceId: process.env.PARTICLE_DEVICE_ID,
            argument: stepperNum.toString(),
            auth: process.env.PARTICLE_TOKEN
          });
        })
        .then(() => {
          return status.asyncDecrementMapkinsAvailable();
        })
        .then(() => {
          return status.asyncIncrementMapkinsDispensed();
        })
        .then(() => {
          console.log(`Successfully dispensed to stepper ${stepperNum}`);
          resolve(stepperNum);
        })
        .catch(err => {
          console.log('Error dispensing mapkin:', err);
          reject(new Error('error_dispensing_mapkin'));
        });
    }
  });
}

module.exports = {
  asyncDispenseMapkin: asyncDispenseMapkin,
  asyncDispenseMapkinToStepper: asyncDispenseMapkinToStepper
};
