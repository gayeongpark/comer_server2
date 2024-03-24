const express = require("express");
const Comment = require("../models/Comment.model");
const { body, validationResult } = require("express-validator");
const { authenticateUser } = require("../middleware/authMiddleware.js");
const router = express.Router();

// Get all comment of a certain product
// I did not implement the authenticate User middleware because all people need to see withou login
router.get("/:experienceId", async (req, res) => {
  try {
    // Find and retrieve comments associated with the specified experienceId.
    const comments = await Comment.find({
      experienceId: req.params.experienceId,
    });
    // Respond with a 200 status and the comments retrieved.
    res.status(200).json(comments);
  } catch (error) {
    // Handle any errors by returning a 500 status and an error message.
    res.status(500).json({ error: "Server Error!" });
  }
});

// Creating a new comment
// If user logged in, user can create comments
router.post(
  "/",
  [
    // Validate the 'description' field
    body("description")
      .trim() // Remove leading and trailing whitespace
      .isLength({ min: 1 }) // Ensure the description is not empty
      .withMessage("Description is required")
      .isLength({ max: 500 }) // Let's say the maximum length is 500 characters
      .withMessage("Description must be less than 500 characters"),
    // Add any other validations here
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // If there are validation errors, return a 400 status with the errors
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      // Extract fields from the request body
      const { userId, experienceId, description } = req.body;

      // Create a new comment instance
      const comment = new Comment({
        userId,
        experienceId,
        description,
      });

      // Save the comment to the database
      await comment.save();

      // Respond with the created comment
      res.status(201).json(comment);
    } catch (error) {
      // If an error occurs, respond with a 500 status and the error message
      res
        .status(500)
        .json({ message: "Failed to post the comment", error: error.message });
    }
  }
);

// Deleting a comment
// Using the authenticateUser for deleting comment only when user is logged in.
router.delete("/delete/:id", authenticateUser, async (req, res) => {
  try {
    // Find the comment with the specified ID.
    const comment = await Comment.findById(req.params.id);

    // Check if the authenticated user is the owner of the comment.
    if (req.user.id === comment.userId) {
      // If the user owns the comment, delete it.
      await Comment.findByIdAndDelete(req.params.id);

      // Respond with a 200 status and a success message.
      res.status(200).json({ message: "The comment has been deleted." });
    } else {
      // If the user does not own the comment, return a 403 status and a message indicating they can only delete their own comments.
      res.status(403).json({ error: "You can delete only your own comments!" });
    }
  } catch (error) {
    // Handle any errors by returning a 500 status and an error message.
    res.status(500).json({ error: "Server Error!" });
  }
});

// I should make comment likes request

module.exports = router;
