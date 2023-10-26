const { Schema, model } = require('mongoose');

const commentSchema = new Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    experienceId: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    likes: {
      type: [String],
    },
    dislikes: {
      type: [String],
    },
  },
  { timestamps: true }
);

const Comment = model('Comment', commentSchema);

module.exports = Comment;
