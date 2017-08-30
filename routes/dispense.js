const express = require('express');
const router = express.Router();
const axios = require('axios');
const qs = require('qs');
const Promise = require('bluebird');

const dispense = require('./../lib/dispense');

router.post('/', (req, res) => {
  if (
    !!req.body &&
    !!req.body.secret &&
    req.body.secret === process.env.SECRET
  ) {
    dispense
      .asyncDispenseMapkin()
      .then(() => {
        res.sendStatus(200);
      })
      .catch(err => {
        console.log(err);
        res.status(500).send({
          message: err.message
        });
      });
  } else {
    console.log('incorrect secret');
    res.status(500).send({ message: 'incorrect_secret' });
  }
});

module.exports = router;
