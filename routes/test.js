const express = require('express');
const router = express.Router();

const status = require('./../lib/status');
const config = require('./../lib/config');

router.get('/', (req, res) => {
  status.asyncCheckIfElectronIsConnected().then(electronIsConnected => {
    res.render('test', {
      config: config,
      electronIsConnected: electronIsConnected
    });
  });
});

module.exports = router;
