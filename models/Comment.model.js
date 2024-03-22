const { Schema, model } = require('mongoose');

// Create a new Mongoose Schema for the "Comment" collection in the database
const commentSchema = new Schema(
  {
    // Define the "userId" field to associate the comment with a user
    userId: {
      type: String,
      required: true, // This field is required, meaning it must be provided
    },
    
    // Define the "experienceId" field to associate the comment with an experience
    experienceId: {
      type: String,
      required: true, // This field is required, meaning it must be provided
    },

    // Define the "description" field for the comment's text content
    description: {
      type: String,
      required: true, // This field is required, meaning a comment must have text
    },

    // // Define the "likes" field to store user IDs who liked the comment
    // likes: {
    //   type: [String], // An array of strings to store user IDs
    // },

    // // Define the "dislikes" field to store user IDs who disliked the comment
    // dislikes: {
    //   type: [String], // An array of strings to store user IDs
    // },
  },
  // Include timestamps for "createdAt" and "updatedAt" fields
  { timestamps: true }
);

// Create a Mongoose model for the "Comment" collection using the defined schema
const Comment = model('Comment', commentSchema);

// Export the Comment model for use in other parts of your application
module.exports = Comment;
