const mongoose = require('mongoose');
// eslint-disable-next-line import/no-extraneous-dependencies
const validator = require('validator');
// eslint-disable-next-line import/no-extraneous-dependencies
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please tell us your name'],
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

const User = mongoose.model('User', userSchema);

module.exports = User;
