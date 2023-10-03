const dotenv = require('dotenv');
const mongoose = require('mongoose');

//catching sync code that is not in callbacks. In callbacks in express will call the global catcher
process.on('uncaughtException', (err) => {
  // with code at bottom
  console.log(err.message);
  console.log('UNCAUGHT EXCEPTION. Shutting down.... ');
  process.exit(1); // this one is quite abrupt should close the server first
});

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
const server = app.listen(process.env.PORT, '127.0.0.1', () => {
  console.log(`server is listening at port:${process.env.PORT}`);
});

//everytime there is a UNHANDLED REJECTION, process will emit an event "unhandledRejection" ==> can demonstrate by changing the DB password
// central place to handle all uncaught application
process.on('unhandledRejection', (err) => {
  console.log(err.message);
  console.log('UNHANDLED REJECTION. Shutting down.... ');
  // let server finish the remaining requests first
  server.close(() => {
    process.exit(1); // this one is quite abrupt should close the server first
  });
});

// console.log(X); // this is uncaught exception... node will be in unclean state, must crash app to check/clean/restart
