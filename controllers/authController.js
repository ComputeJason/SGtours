/* eslint-disable import/no-extraneous-dependencies */
const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

const sign = (id) =>
  jwt.sign({ id: id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangedAt: req.body.passwordChangedAt,
    role: req.body.role,
  });

  const token = sign(newUser._id);

  res.status(201).json({
    status: 'success',
    token: token,
    data: newUser,
  });
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // check if email exist
  if (!email || !password) {
    return next(new AppError('Please enter Email & Password'), 400);
  }

  // check if user and password is correct
  const user = await User.findOne({ email }).select('+password'); // IMPT, because schema we don't select password, to make it appear, needs a +

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Wrong password or email!', 401));
  }

  // if all ok, send token to client

  const token = sign(user._id);

  res.status(200).json({
    status: 'success',
    token,
  });
});

// VERY COMPLETE route protecting algo!!
exports.protect = catchAsync(async (req, res, next) => {
  // 1) check if token is there
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer') // Convention *** header in request has "Authorization" => value "Bearer <TOKEN>"
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new AppError('You are not logged in. Log in to continue', 401));
  }

  // 2) verify token (he say most ppl stop here, but not the most secure)
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET); // either 1) invalid signature if change the data  OR 2) token expired
  console.log(decoded);

  // 3) check if user still exists (in case he delete his account)
  const freshUser = await User.findById(decoded.id);
  if (!freshUser) {
    return next(new AppError('This user no longer exists', 401));
  }

  // 4) check if user changed password after the token was issued (in case someone stole his PW then he change pw, old token shouldn't work! )
  if (freshUser.changedPasswordAfterTokenCreated(decoded.iat)) {
    return next(
      new AppError('User recently changed password! Please login again', 401),
    );
  }

  // 5) if all good, grant ACCESS to route and add the user info to the response!
  req.user = freshUser;
  next();
});

exports.restrictTo =
  (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403),
      );
    }
    next();
  };

exports.forgotPW = catchAsync(async (req, res, next) => {
  // 1) Get user based on email
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new AppError('There is no user with this email', 404));
  }

  // 2) Generate random token
  const resetToken = user.createPasswordResetToken();

  // MUST ADD VALIDATE BEFORE SAVE ==> we are changing the user but not providing *required fields. else it won't work
  await user.save({ validateBeforeSave: false });

  // 3) send it to users email
});

exports.resetPW = (req, res, next) => {
  next();
};
