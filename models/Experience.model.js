const { Schema, model } = require("mongoose");
// const User = require('./User.model');

// Create a new Mongoose Schema for the "Experience" collection in the database
const experienceSchema = new Schema(
  {
    // Define the "userId" field to link experiences to users
    userId: {
      type: String,
    },
    // Define fields for experience details
    title: {
      type: String,
    },
    language: {
      type: [String], // Array of strings
      // Define a setter function to parse and format the language array
      set: function (language) {
        // Parse the stringified array and return it
        // It is to make consistency in how the data is store and retrieved
        // By parsing it, It made me easy to deal with array in the front end.
        return JSON.parse(language).map((lang) => lang.value);
      },
    },
    description: {
      type: String,
    },
    runningTime: {
      type: Number,
    },
    minimumAge: {
      type: Number,
    },
    country: {
      type: String,
    },
    city: {
      type: String,
    },
    state: {
      type: String,
    },
    address: {
      type: String,
    },
    criteriaOfGuest: {
      type: String,
    },
    longitude: {
      type: Number,
    },
    latitude: {
      type: Number,
    },
    coordinates: {
      type: [String], // Array of strings
    },
    fullAddress: {
      type: String,
    },
    files: { type: [String] }, // Array of strings
    likes: { type: [String] }, // Array of strings
    perks: {
      food: {
        type: String,
      },
      beverage: {
        type: String,
      },
      alcohol: {
        type: String,
      },
      equipment: {
        type: String,
      },
      others: {
        type: String,
      },
    },
    notice: {
      type: String,
    },
    startTime: {
      type: String,
    },
    kidsAllowed: {
      type: Boolean,
    },
    petsAllowed: {
      type: Boolean,
    },
    endTime: {
      type: String,
    },
    maxGuest: {
      type: Number,
    },
    price: {
      type: Number,
    },
    currency: {
      type: String,
    },
    tags: {
      type: [String], // Array of strings
      // Define a "set" function to parse and format the tags array
      set: function (tags) {
        // Parse the stringified array and return it as an array of values
        // It is to make consistency in how the data is store and retrieved
        return JSON.parse(tags);
      },
    },
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
    },
    cancellation1: {
      type: Boolean,
    },
    cancellation2: {
      type: Boolean,
    },
  },
  // Include timestamps for "createdAt" and "updatedAt" fields
  // This can be used later if my website is scaled much more
  { timestamps: true }
);

// Create a Mongoose model for the "Experience" collection using the defined schema
const Experience = model("Experience", experienceSchema);

// Export the Experience model for use in other parts of your application
module.exports = Experience;
