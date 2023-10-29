const { Schema, model } = require('mongoose');

// TODO: Please make sure you edit the User model to whatever makes sense in this case
// I do not use this data shema no logner
const resetSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  token: {
    type: String,
    unique: true,
  },
});

const Reset = model('Reset', resetSchema);

module.exports = Reset;
