const AppError = require('../utils/appError');

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

const sendErrorProd = (err, res) => {
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  } else {
    // unknown error, leak as little to clients

    console.error('ERROR!!💥', err);

    res.status(500).json({
      status: 'error',
      message: 'Something went very wrong!',
    });
  }
};

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

const handleUniqueFieldsErrorDB = (err) => {
  const message = `Duplicate name: ${err.keyValue.name}. Please use another name!`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid Input Data. ${errors.join('. ')}`;

  return new AppError(message, 400);
};

// 4 params express knows its a error handling middleware! cool
module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === 'production') {
    // eslint-disable-next-line node/no-unsupported-features/es-syntax
    let error = { ...err };

    console.log(error);
    console.log(error.name);

    if (error.kind === 'ObjectId') {
      error = handleCastErrorDB(error);
    }
    if (error.code === 11000) {
      error = handleUniqueFieldsErrorDB(error);
    }
    if (error._message === 'Tour validation failed') {
      error = handleValidationErrorDB(error);
    }
    sendErrorProd(error, res);
  }
};
