const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const mongoURI = process.env.MONGODB_URI;
app.use(bodyParser.json());
app.use(cors());


// app.use((req, res, next) => {
//   console.log(`${req.method} ${req.url}`);
//   console.log('Headers:', req.headers);
//   console.log('Body:', req.body);
//   next();
// });

const postsRouter = require('./routes/posts');
app.use('/posts', postsRouter);

mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});

app.get('/', (req, res) => {
  res.send('Hello World');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
