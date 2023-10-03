/* eslint-disable import/no-extraneous-dependencies */
const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      unique: true,
      required: [true, 'A tour must have a name'],
      trim: true,
      maxlength: [40, 'Tour name must have less than or equal 40 chars'],
      minlength: [10, 'Tour name must have more than or equal 10 chars'],
      // validate: [validator.isAlpha, 'Name contains non-characters'],
    },
    duration: {
      type: Number,
      require: [true, 'A tour must have a duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a max group size'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      enum: {
        message: 'Difficulty can only be easy, medium or difficult!',
        values: ['easy', 'medium', 'difficult'],
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be more than or equal to 1'],
      max: [5, 'Rating must be less than or equal to 5'],
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price'],
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          // does not work for update
          return val < this.price;
        },
        message:
          // eslint-disable-next-line no-template-curly-in-string
          'Price discount is more than price! discount of ${VALUE} is too high',
      },
    },
    summary: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a description'],
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a imageCover'],
    },
    images: [String],
    createdAt: {
      select: false,
      type: Date,
      default: Date.now(),
    },
    startDates: {
      type: [Date],
    },
    slug: String,
    secretTour: {
      type: Boolean,
      default: false,
    },
  },
  {
    toJSON: { virtuals: true }, // cant add into query, cause it technically doesn't exist
    toObject: { virtuals: true },
  },
);

// need a normal function to access THIS keyword
tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

// DOCUMENT middleware => on save() and create(), not for find.. or insert...
tourSchema.pre('save', function (next) {
  this.slug = slugify(slugify(this.name, { lower: true }));
  next();
});

// Can have multiple
// tourSchema.pre('save', function (next) {
//   console.log('I am second pre-save middleware!');
//   next();
// });

// tourSchema.post('save', function (doc, next) {
//   console.log('i am post save middlware!');
//   next();
// });

tourSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } });
  this.start = Date.now();
  next();
});

tourSchema.post(/^find/, function (doc, next) {
  console.log(`Query took ${Date.now() - this.start} milliseconds`);
  next();
});

//Aggregation middleware ==> happens before and after aggregation. THIS is aggregation object. THIS.pipeline() -> show the aggregation object
tourSchema.pre('aggregate', function (next) {
  this.pipeline().unshift({ $match: { secretTour: { $ne: true } } }); //add beginning of array
  next();
});

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
