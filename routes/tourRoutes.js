const express = require('express');
const tourController = require('../controllers/tourControllers');
const authController = require('../controllers/authController');

const tourRouter = express.Router();

// tourRouter.param('id', tourController.checkID);

tourRouter
  .route('/top-5-tours')
  .get(tourController.aliasTopTours, tourController.getAllTours);

tourRouter.route('/tour-stats').get(tourController.getTourStats);

tourRouter.route('/get-monthly-plan/:year').get(tourController.getMonthlyPlan);

tourRouter
  .route('/')
  .get(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.getAllTours,
  )
  .post(tourController.createTour);

tourRouter
  .route('/:id')
  .get(tourController.getTour)
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.deleteTour,
  )
  .patch(tourController.updateTour);

module.exports = tourRouter;
