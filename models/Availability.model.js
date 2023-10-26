const { Schema, model } = require("mongoose");

const availabilitySchema = new Schema(
  {
    experienceId: {
      type: String,
    },
    dateMaxGuestPairs: [
      {
        date: {
          type: Date,
          required: true,
        },
        startTime: {
          type: String,
          require: true,
        },
        endTime: {
          type: String,
          require: true,
        },
        maxGuest: {
          type: Number,
          required: true,
        },
        price: {
          type: Number,
          require: true,
        },
        currency: {
          type: String,
          require: true,
        },
      },
    ],
  },
  { timestamps: true }
);

const Availability = model("Availability", availabilitySchema);

module.exports = Availability;
