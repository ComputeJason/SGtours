/* eslint-disable import/order */
/* eslint-disable import/no-extraneous-dependencies */
const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const sendEmail = require('../utils/email');
const crypto = require('crypto');

const sign = (id) =>
  jwt.sign({ id: id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

const createSendToken = (user, statusCode, res) => {
  const token = sign(user._id);

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
    ),
    httpOnly: true, // set that browser cannot edit this
  };

  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true; // only sent during HTTPS

  res.cookie('jwt', token, cookieOptions);

  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: user,
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangedAt: req.body.passwordChangedAt,
    role: req.body.role,
  });

  createSendToken(newUser, 201, res);
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
  createSendToken(user, 200, res);
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
  const resetURL = `${req.protocol}://${req.get(
    'host',
  )}/api/v1/users/resetPassword/${resetToken}`;

  const message = `Forgot your password? Submit a PATCH request with your new password and confirm to : ${resetURL}. Else, please ignore this email!  `;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Your password reset token (valid for 10mins)',
      message: message,
    });
    res.status(200).json({
      status: 'success',
      message: 'Token sent to email!',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(
      new AppError(
        'There was an error sending the email. Try again later!',
        500,
      ),
    );
  }
});

exports.resetPW = catchAsync(async (req, res, next) => {
  // 1) get user based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }, // at the same time find the user, and check if the token expired!
  });

  // 2) if token not expire, and there is user, set the new pw
  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  user.save();

  // 3) update changedPasswordAt property for this user
  // done in middleware onSave

  // 4) log the user in, send JWT
  createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) get user
  const user = await User.findById(req.user.id).select('+password');

  // 2) check password matches
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('The password you input is wrong!', 401));
  }

  // 3) update user password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();

  // 4) log user in
  createSendToken(user, 200, res);
});
