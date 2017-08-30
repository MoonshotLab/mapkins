const express = require('express');
const router = express.Router();
const low = require('lowdb');
const dbFile = 'db.json';

const dispense = require('./../lib/dispense');

router.use('/', (req, res) => {
  dispense
    .asyncResetDb()
    .then(() => {
      res.sendStatus(200);
    })
    .catch(err => {
      res.status(500).send(err);
    });
});

module.exports = router;
