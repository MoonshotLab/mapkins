const express = require('express');
const router = express.Router();

const db = require('./../lib/db');
const notify = require('./../lib/notify');

router.use('/', (req, res) => {
  db
    .asyncResetMapkinsCount()
    .then(() => {
      return notify.asyncNotifyEveryoneOnWaitlistOfRefill();
    })
    .then(() => {
      res.send('200');
    })
    .catch(err => {
      console.log(err);
      res.status(500).send(err);
    });
});

module.exports = router;
