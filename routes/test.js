const express = require('express');
const router = express.Router();

const config = require('./../lib/config');

router.get('/', (req, res) => {
  res.render('test', {
    config: config
  });
});

module.exports = router;
