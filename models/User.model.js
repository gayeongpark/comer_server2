const { Schema, model } = require("mongoose");

// Create a new Mongoose Schema for the "User" collection in the database
const userSchema = new Schema(
  {
    // Define the "email" field with its properties
    email: {
      type: String, // Data type is String
      required: true, // It is required (cannot be empty)
      unique: true, // Each email address must be unique in the database
      // I made the email address unique, it means no same address in the database.
    },

    // Define the "password" field with its properties
    password: {
      type: String, // Data type is String
      required: true, // It is required (cannot be empty)
    },

    // Define the "password2" field with its properties
    password2: {
      type: String, // Data type is String
      required: true, // It is required (cannot be empty)
    },

    // Define optional user details fields
    firstName: {
      type: String,
    },
    lastName: {
      type: String,
    },
    phoneNumber: {
      type: Number,
    },
    isActive: {
      type: Boolean,
      default: false, // Default value is set to false
    },
    profilePicture: {
      type: String,
    },
    country: {
      type: String,
    },
    city: {
      type: String,
    },
    province: {
      type: String,
    },
    zip: {
      type: Number,
    },
    street: {
      type: String,
    },
    description: {
      type: String,
    },

    // Define fields related to user verification and authentication
    isVerified: {
      type: Boolean,
      default: false, // Default value is set to false
    },
    emailToken: {
      type: String,
    },
    resetPasswordEmailToken: {
      type: String,
    },
  },
  // Include timestamps for "createdAt" and "updatedAt" fields
  { timestamps: true }
);

// Create a Mongoose model for the "User" collection using the defined schema
const User = model("User", userSchema);

// Export the User model for use in other parts of your application
module.exports = User;
