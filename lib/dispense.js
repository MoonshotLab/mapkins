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
        return particle.callFunction({
          name: 'dispense',
          deviceId: process.env.PARTICLE_DEVICE_ID,
          argument: `stepper:${currentStepper}`,
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

module.exports = {
  asyncDispenseMapkin: asyncDispenseMapkin
};
