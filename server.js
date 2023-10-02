const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config({ path: './config.env' });

const DB = process.env.DB.replace('<PASSWORD>', process.env.DB_PW);

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then(() => {
    console.log('DB Connection successful');
  });

const app = require('./app');

// Starting server
app.listen(process.env.PORT, '127.0.0.1', () => {
  console.log(`server is listening at port:${process.env.PORT}`);
});
