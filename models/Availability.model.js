// Import necessary modules from Mongoose
const { Schema, model } = require("mongoose");

// Create a new Mongoose Schema for the "Availability" collection in the database
// I hope I can come up with a great way to store the booking slot efficiently
const availabilitySchema = new Schema(
  {
    // Define the "experienceId" field to associate the availability with an experience
    experienceId: {
      type: String,
    },

    // Define the "dateMaxGuestPairs" field as an array of objects
    dateMaxGuestPairs: [
      {
        // Each object in the array has the following fields
        date: {
          type: Date,
          required: true, // The date is required
        },
        startTime: {
          type: String,
          require: true, // The start time is required
        },
        endTime: {
          type: String,
          require: true, // The end time is required
        },
        maxGuest: {
          type: Number,
          required: true, // The maximum guest count is required
        },
        price: {
          type: Number,
          required: true, // The price is required
        },
        currency: {
          type: String,
          required: true, // The currency is required
        },
      },
    ],

    // Define the "booking" field as an array of objects to store booking information
    booking: [
      {
        // Each object in the array has the following fields
        date: {
          type: Date,
        },
        slotId: {
          type: String,
        },
        userId: {
          type: String,
        },
        experienceId: {
          type: String,
        },
        experienceTitle: {
          type: String,
        },
        userEmail: {
          type: String,
        },
        startTime: {
          type: String,
        },
        endTime: {
          type: String,
        },
      },
    ],
  },
  // Include timestamps for "createdAt" and "updatedAt" fields
  { timestamps: true }
);

// Create a Mongoose model for the "Availability" collection using the defined schema
const Availability = model("Availability", availabilitySchema);

// Export the Availability model for use in other parts of your application
module.exports = Availability;
