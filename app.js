const express = require('express');

const app = express();
const port = 3000;

app.use(express.static('touch-events'));


app.listen(port, () => {
  console.log('Server listening at port ', port);
})