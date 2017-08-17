require('dotenv').config();

const express = require('express');
const app = express();
const path = require('path');

// app.set('view engine', 'pug');
// app.use(express.static(path.join(__dirname, 'public')));

require('./botkit-controller')(app);

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log('Server running on port ' + port);
});
