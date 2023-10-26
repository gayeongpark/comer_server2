const { Schema, model } = require("mongoose");

const userSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    password2: {
      type: String,
      required: true,
    },
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
      default: false,
    },
    profilePicture: { type: String },
    country: { type: String },
    city: { type: String },
    province: { type: String },
    zip: { type: Number },
    street: { tpye: String },
    description: { type: String },
    isVerified: {
      type: Boolean,
      default: false,
    },
    emailToken: { type: String },
    resetPasswordEmailToken: {
      type: String,
    },
  },
  { timestamps: true }
);

const User = model("User", userSchema);

module.exports = User;
