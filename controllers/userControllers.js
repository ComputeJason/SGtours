const User = require('../models/userModel');
const APIFeatures = require('../utils/apiFeatures');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.getAllUsers = (req, res) => {
  res.status(500).json({
    status: 'error',
    data: 'Route not yet defined',
  });
};

exports.getAllUsers = catchAsync(async (req, res, next) => {
  //EXECUTE QUERY
  const allUsers = await User.find();

  //SEND RESPONSE
  res.status(200).json({
    status: 'success',
    requestedAt: req.requestTime,
    sentBackAt: new Date().toISOString(),
    results: allUsers.length,
    data: {
      allUsers,
    },
  });
});

exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    data: 'Route not yet defined',
  });
};

exports.getUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    data: 'Route not yet defined',
  });
};

exports.updateUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    data: 'Route not yet defined',
  });
};

exports.deleteUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    data: 'Route not yet defined',
  });
};
