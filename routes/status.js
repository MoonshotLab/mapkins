const express = require('express');
const router = express.Router();
// const low = require('lowdb');
const Promise = require('bluebird');

const status = require('./../lib/status');
const botkit = require('./../lib/botkit');
const controller = botkit.controller;

router.get('/', (req, res) => {
  // Promise.all(
  //   status.asyncGetMapkinsLeft(),
  //   status.asyncGetTotalMapkinsDispensed(),
  //   user.asyncGetNumUsers()
  // ).then(promiseResultsArray => {
  //   console.log(promiseResultsArray);
  //   res.sendStatus(200);
  // });
  // dispense
  //   .asyncGetMapkinsLeft()
  //   .then(mapkinsLeft => {
  //     res.render('status', {
  //       mapkinsLeft: mapkinsLeft
  //     });
  //   })
  //   .catch(err => {
  //     res.status(500).send({
  //       message: err.message
  //     });
  //   });
});

module.exports = router;
