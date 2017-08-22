require('dotenv').config();

const express = require('express');
const app = express();
const path = require('path');

app.set('view engine', 'pug');
// app.use(express.static(path.join(__dirname, 'public')));

require('./botkit-controller')(app);

app.get('/', (req, res) => {
  res.redirect('https://www.barkleyus.com/');
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log('Server running on port ' + port);
});
