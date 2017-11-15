const express = require('express');
const router = express.Router();

const user = require('./../lib/user');

router.get('/', (req, res) => {
  res.render('resetNumber');
});

router.post('/', (req, res) => {
  try {
    const number = req.body.number;

    if (!!number) {
      // check how many digits we have
      let numStr = number.toString().replace(/\D/g, '');

      if (numStr.length < 10 || numStr.length > 11) {
        res.status(500).send('invalid');
      } else {
        if (numStr.length === 10) {
          numStr = `1${numStr}`; // prefix with 1
        }

        // length is 11, add + at beginning
        numStr = `+${numStr}`;

        user
          .asyncRemoveUserFromDb(numStr)
          .then(() => {
            res.sendStatus(200);
          })
          .catch(e => {
            console.log(e);
            res.sendStatus(500);
          });
      }
    } else {
      res.sendStatus(500);
    }
  } catch (e) {
    console.log(e);
    res.sendStatus(500);
  }
});

module.exports = router;
