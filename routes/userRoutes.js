const express = require('express');
const fs = require('fs');
const authController = require('../controllers/authController');

// eslint-disable-next-line import/no-dynamic-require
const userController = require(`${__dirname}/../controllers/userControllers`);

const userRouter = express.Router();

userRouter.route('/signup').post(authController.signup);
userRouter.route('/login').post(authController.login);
userRouter.route('/forgotPassword').post(authController.forgotPW);
userRouter.route('/resetPassword/:token').patch(authController.resetPW);

userRouter
  .route('/updateMe')
  .patch(authController.protect, userController.updateMe);

userRouter
  .route('/deleteMe')
  .delete(authController.protect, userController.deleteMe);

userRouter
  .route('/updateMyPassword/')
  .patch(authController.protect, authController.updatePassword);

userRouter
  .route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);
userRouter
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = userRouter;
