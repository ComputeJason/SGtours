/* eslint-disable import/no-extraneous-dependencies */
const tourRouter = require(`./routes/tourRoutes`);
const userRouter = require(`./routes/userRoutes`);

const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitise = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');

const app = express();

// MIDDLEWARES

// Development logging!
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Set security HTTP headers (read documentations for further knowledge) ((this is industry standard just use))
app.use(helmet());

// Limit requests from same API
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP please try again in an hour!',
});
app.use('/api', limiter);

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' })); // wont accept data more than 10kb for malicious intent

// Data sanitisation against noSQL query injection
app.use(mongoSanitise()); // looks at req and removes all dollar signs and possibly malicious inputs

// Data sanitisation against XSS
app.use(xss()); // clean request from malicious HTML code`

// Prevent parameter pollution! If add more than 1 same name param in query string in URL (whitelist params so duplicates wont be eliminated)
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  }),
);

// Able to read URLs for static resource in
app.use(express.static(`${__dirname}/public`));

// Test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  // console.log(req.headers)
  next();
});

// ROUTE HANDLERS

// app.get('/api/v1/tours',getTours);
// app.get('/api/v1/tours/:id',getTour );
// app.post('/api/v1/tours',createTour);
// app.patch('/api/v1/tours/:id',updateTour);
// app.delete('/api/v1/tours/:id',deleteTour );

// ROUTES

app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);

app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this Server!`, 404)); // anything passed into next will default be taken as a ERROR in express
});

// 4 params express knows its a error handling middleware! cool
app.use(globalErrorHandler);

module.exports = app;
