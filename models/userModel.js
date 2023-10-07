const mongoose = require('mongoose');
// eslint-disable-next-line import/no-extraneous-dependencies
const validator = require('validator');
// eslint-disable-next-line import/no-extraneous-dependencies
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please tell us your name'],
  },
  role: {
    type: String,
    default: 'user',
    enum: ['lead-guide', 'user', 'admin', 'guide'],
  },
  email: {
    type: String,
    required: [true, 'Please enter your email'],
    unique: [true, 'This email already exists'],
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email'],
  },
  photo: String,
  password: {
    type: String,
    required: [true, 'Please enter a password.'],
    minlength: [8, 'Password should have atleast 8 chars!'],
    // don't leak password to client even if it is encrypted
    // select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    validate: {
      validator: function (el) {
        return el === this.password;
      },
      message: 'Passwords are not the same!',
    },
  },
  passwordChangedAt: {
    type: Date,
  },
  passwordResetToken: String,
  passwordResetExpires: Date,
});

userSchema.pre('save', async function (next) {
  // every field has this isModified, only run if password is modified
  if (!this.isModified('password')) {
    return next();
  }

  this.password = await bcrypt.hash(this.password, 12); // is good enough and not too long like 16
  this.passwordConfirm = undefined;
  return next();
});

// instance methods can be created with Schema and can be accessed from any document! Can't use "this" because we deselected PW, need to pass it in
userSchema.methods.correctPassword = async function (candidatePW, userPW) {
  return await bcrypt.compare(candidatePW, userPW);
};

userSchema.methods.changedPasswordAfterTokenCreated = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10,
    );
    console.log(this.passwordChangedAt);

    return JWTTimestamp < changedTimestamp;
  }

  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  // create token
  const resetToken = crypto.randomBytes(32).toString('hex');

  // encrpyt token to save in DB
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  console.log({ resetToken }, this.passwordResetToken);

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
