const express = require('express');
const router = express.Router();
// const low = require('lowdb');
const Promise = require('bluebird');

const status = require('./../lib/status');
const user = require('./../lib/user');

function asyncReject() {
  return new Promise((resolve, reject) => {
    reject(new Error('test'));
  });
}

router.get('/', (req, res) => {
  const promises = [
    status.asyncCheckIfElectronIsConnected(),
    status.asyncGetMapkinsLeft(),
    status.asyncGetTotalMapkinsDispensed(),
    user.asyncGetNumUsers(),
    user.asyncGetWaitlist()
  ];

  Promise.all(promises)
    .then(promiseResultsArray => {
      const [
        electronIsConnected,
        mapkinsLeft,
        totalMapkinsDispensed,
        numUsers,
        waitlist
      ] = promiseResultsArray;

      res.render('status', {
        electronIsConnected: electronIsConnected,
        mapkinsLeft: mapkinsLeft,
        totalMapkinsDispensed: totalMapkinsDispensed,
        numUsers: numUsers,
        waitlist: waitlist
      });
    })
    .catch(err => {
      console.log(err);
      res.sendStatus(500);
    });
});

module.exports = router;
