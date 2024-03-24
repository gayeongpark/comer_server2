const express = require("express");
const Comment = require("../models/Comment.model");
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
router.post("/", authenticateUser, async (req, res) => {
  try {
    // Create a new comment using the data from the request body, and associate it with the authenticated user.
    const newComment = await Comment.create({
      ...req.body,
      userId: req.user.id,
    });
    // console.log(newComment)
    // Respond with a 200 status and the newly created comment.
    res.status(200).json(newComment);
  } catch (error) {
    // Handle any errors by returning a 500 status and an error message.
    res.status(500).json({ error: "Server Error!" });
  }
});

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
      res.status(200).json("The comment has been deleted.");
    } else {
      // If the user does not own the comment, return a 403 status and a message indicating they can only delete their own comments.
      res.status(403).json("You can delete only your own comments!");
    }
  } catch (error) {
    // Handle any errors by returning a 500 status and an error message.
    res.status(500).json({ error: "Server Error!" });
  }
});

// I should make comment likes request

module.exports = router;
