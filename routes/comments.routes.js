const express = require("express");
const Experience = require("../models/Experience.model");
const Comment = require("../models/Comment.model");
const { authenticateUser } = require("../middleware/authMiddleware.js");
const router = express.Router();

//get all comment of a certain product
router.get("/:experienceId", async (req, res, next) => {
  try {
    const comments = await Comment.find({
      experienceId: req.params.experienceId,
    });
    res.status(200).json(comments);
  } catch (error) {
    next(error);
  }
});

router.post("/", authenticateUser, async (req, res, next) => {
  try {
    const newComment = await Comment.create({
      ...req.body,
      userId: req.user.id,
    });
    // console.log(newComment)
    res.status(200).json(newComment);
  } catch (error) {
    next(error);
  }
});

router.delete("/delete/:id", authenticateUser, async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (req.user.id === comment.userId) {
      await Comment.findByIdAndDelete(req.params.id);
      res.status(200).json("The comment has been deleted.");
    } else {
      res.status(403).json("You can delete only your own comments!");
    }
  } catch (error) {
    next(error);
  }
});

module.exports = router;
