const express = require('express');
const router = express.Router();

const db = require('./../lib/db');

router.use('/', (req, res) => {
  db
    .asyncResetMapkinsCount()
    .then(() => {
      res.sendStatus(200);
    })
    .catch(err => {
      res.status(500).send(err);
    });
});

module.exports = router;
