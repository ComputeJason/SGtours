const User = require('../models/userModel');
const APIFeatures = require('../utils/apiFeatures');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};

  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) {
      newObj[el] = obj[el];
    }
  });

  return newObj;
};

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

exports.updateMe = catchAsync(async (req, res, next) => {
  // 0) create error if user posts PW data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password updates. Please use /updateMyPassword',
        400,
      ),
    );
  }

  // have to clean object to what users can change! Else they can change their ROLE
  const filteredBody = filterObj(req.body, 'name', 'email');

  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });

  // 1) update user document

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  const deletedUser = await User.findByIdAndUpdate(req.user.id, {
    active: false,
  });

  res.status(204).json({
    status: 'success',
    data: null,
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
