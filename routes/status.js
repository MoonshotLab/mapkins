const express = require('express');
const router = express.Router();
// const low = require('lowdb');

router.get('/', (req, res) => {
  res.render('status');
});

module.exports = router;
