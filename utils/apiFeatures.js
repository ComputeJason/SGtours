class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    // Filtering
    // eslint-disable-next-line node/no-unsupported-features/es-syntax
    const queryObj = { ...this.queryString };
    const excludedFields = ['page', 'sort', 'fields', 'limit'];
    console.log(this.queryString);

    excludedFields.forEach((el) => delete queryObj[el]);

    //Advanced Filtering
    let queryStr = JSON.stringify(queryObj);
    console.log(queryStr);

    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (word) => `$${word}`);

    this.query = this.query.find(JSON.parse(queryStr));
    return this;
  }

  sort() {
    //Sorting
    if (this.queryString.sort) {
      //2x or more same values creates an arrays which attackers can use
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort('-createdAt');
    }
    return this;
  }

  limitFields() {
    //limiting fields
    if (this.queryString.fields) {
      const limitedFields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(limitedFields);
    } else {
      this.query = this.query.select('-__v -images');
    }
    return this;
  }

  paginate() {
    //pagination (if there are 1mil data, can't be return all at once)
    const pageNo = this.queryString.page * 1 || 1;
    const limitNo = this.queryString.limit * 1 || 100;
    const skipNo = (pageNo - 1) * limitNo;

    this.query = this.query.skip(skipNo).limit(limitNo);
    return this;
  }
}

module.exports = APIFeatures;
