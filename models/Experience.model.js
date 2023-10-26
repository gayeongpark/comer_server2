const { Schema, model } = require('mongoose');
// const User = require('./User.model');

const experienceSchema = new Schema(
  {
    userId: {
      type: String,
    },
    title: {
      type: String,
      require: true,
    },
    language: {
      type: [String],
      set: function (language) {
        // Parse the stringified array and return it
        return JSON.parse(language).map((lang) => lang.value);
      },
    },
    description: {
      type: String,
      require: true,
    },
    runningTime: {
      type: Number,
    },
    minimumAge: {
      type: Number,
      require: true,
    },
    country: {
      type: String,
      require: true,
    },
    city: {
      type: String,
      require: true,
    },
    state: {
      type: String,
      require: true,
    },
    address: {
      type: String,
      require: true,
    },
    criteriaOfGuest: {
      type: String,
      require: true,
    },
    longitude: {
      type: Number,
      require: true,
    },
    latitude: {
      type: Number,
      require: true,
    },
    coordinates: {
      type: [String],
      require: true,
    },
    fullAddress: {
      type: String,
      require: true,
    },
    files: { type: [String], require: true },
    likes: { type: [String] },
    perks: {
      food: {
        type: String,
        require: true,
      },
      beverage: {
        type: String,
        require: true,
      },
      alcohol: {
        type: String,
        require: true,
      },
      equipment: {
        type: String,
        require: true,
      },
      others: {
        type: String,
        require: true,
      },
    },
    notice: {
      type: String,
      require: true,
    },
    startTime: {
      type: String,
      require: true,
    },
    kidsAllowed: {
      type: Boolean,
      require: true,
    },
    petsAllowed: {
      type: Boolean,
      require: true,
    },
    endTime: {
      type: String,
      require: true,
    },
    maxGuest: {
      type: Number,
      require: true,
    },
    price: {
      type: Number,
      require: true,
    },
    currency: {
      type: String,
      require: true,
    },
    tags: {
      type: [String],
      require: true,
      set: function (tags) {
        // Parse the stringified array and return it
        return JSON.parse(tags);
      },
    },
    startDate: {
      type: Date,
      require: true,
    },
    endDate: {
      type: Date,
      require: true,
    },
    cancellation1: {
      type: Boolean,
      require: true,
    },
    cancellation2: {
      type: Boolean,
      require: true,
    },
  },
  { timestamps: true }
);

const Experience = model('Experience', experienceSchema);

module.exports = Experience;
