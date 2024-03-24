const express = require("express");
const { S3Client } = require("@aws-sdk/client-s3");
const multer = require("multer");
const multerS3 = require("multer-s3");
const { authenticateUser } = require("../middleware/authMiddleware.js");
const User = require("../models/User.model");
const Experience = require("../models/Experience.model");
const router = express.Router();

//get user
router.get("/:id", authenticateUser, async (req, res) => {
  try {
    // Find and retrieve the user with the specified ID.
    const user = await User.findById(req.params.id);

    // Check if the user with the given ID exists.
    if (!user) {
      return res.status(404).json("User not found");
    }

    // Ensure that the user making the request is the same as the user being retrieved.
    if (user.id !== req.user.id) {
      return res.status(404).json("User not found");
    }

    // Respond with a 200 status and the user's information.
    res.status(200).json(user);
  } catch (error) {
    // Handle any errors by returning a 500 status and an error message.
    res.status(500).json({ error: "Server Error!" });
  }
});

//get user for comments
router.get("/comments/:id", async (req, res, next) => {
  try {
    // Find and retrieve the user with the specified ID.
    const user = await User.findById(req.params.id);

    // Check if the user with the given ID exists.
    if (!user) {
      return res.status(404).json("User not found");
    }

    // Respond with a 200 status and the user's information.
    res.status(200).json(user);
  } catch (error) {
    // Handle any errors by returning a 500 status and an error message.
    res.status(500).json({ error: "Server Error!" });
  }
});

const s3Client = new S3Client({
  region: "eu-north-1",
  credentials: {
    accessKeyId: process.env.AWS_S3_ACCESSKEY,
    secretAccessKey: process.env.AWS_S3_SECRETKEY,
  },
});

// Define a Multer-S3 storage engine using the S3 client from AWS SDK v3.
const storage = multerS3({
  s3: s3Client,
  bucket: "comer-images",
  acl: "public-read",
  key: function (req, file, cb) {
    cb(null, `${Date.now().toString()}-${file.originalname}`);
  },
});

// Create the Multer middleware for handling file uploads.
const upload = multer({ storage });

//3. If a file was uploaded, it will set the profilePicture field in the request body to the path of the uploaded file. The path of the uploaded file will be available in req.file.path.
router.put(
  "/update/:id",
  authenticateUser,
  upload.single("profilePicture"), // This is multer handler
  async (req, res) => {
    // console.log('PUT request received');
    // console.log('Request file:', req.file);
    try {
      // If a file was uploaded, set the profilePicture field to the path of the uploaded file
      if (req.file) {
        req.body.profilePicture = req.file.path;
      }
      // console.log(req.file);

      // Extract and sanitize the image URL by replacing backslashes with forward slashes for cross-platform compatibility.
      let imageUrl = req.file?.location;
      // Update the user's information, including the profile picture, and return the updated user.
      const updatedUser = await User.findByIdAndUpdate(
        req.user.id,
        {
          // $set: MongoDB update operator that instructs the database to set or update specific fields in the document
          $set: {
            // The spread operator (...) to include all the fields from the req.body object in the update.
            ...req.body,
            profilePicture: imageUrl,
          },
        },
        { new: true } // MongoDB returns the updated document in the response. In other words, it means that after the update is performed, the response will include the document as it exists after the update has been applied.
      );
      // console.log('Updated user:', updatedUser);
      // Check if the user exists and respond accordingly.
      if (!updatedUser) {
        return res.status(404).json("User not found");
      }
      // Respond with a 200 status and the updated user's information.
      res.status(200).json(updatedUser);
    } catch (error) {
      // Handle any errors by returning a 500 status and an error message.
      res.status(500).json({ error: "Server Error!" });
    }
  }
);

// Delete user only when user is logged in.
router.delete("/delete/:id", authenticateUser, async (req, res) => {
  try {
    // Find and retrieve the user with the specified ID.
    const user = await User.findById(req.params.id);

    // Ensure that the user making the request is the same as the user being deleted.
    if (user.id !== req.user.id) {
      return res.status(404).json({ error: "User not found." });
    }

    // Set the user's "isActive" property to false to deactivate the account.
    // This step logically deactivates the account without immediate data deletion.
    await User.findOneAndUpdate(
      { _id: user._id },
      { isActive: false },
      { new: true }
    );

    // Clear the user's access and refresh tokens to log them out.
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");

    // Respond with a 200 status and a message indicating that the account deletion process is initiated.
    res
      .status(200)
      .json({ message: "We are deleting your account. Please hold on..." });
  } catch (error) {
    // Handle any errors by returning a 500 status and an error message.
    res.status(500).json({ error: "Server Error!" });
  }
});

// Likes a posted experience
router.put("/likes/:id", authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const experienceId = req.params.id;

    // Retrieve the authenticated user's ID and the experience ID from the request.
    // console.log(`User ID: ${userId}`);
    // console.log(`Experience ID: ${experienceId}`);

    const experience = await Experience.findById(experienceId);

    if (!experience) {
      // Check if the experience with the given ID exists; if not, return a 404 response.
      return res.status(404).json("Experience not found");
    }

    const index = experience.likes.indexOf(userId);

    // console.log(`Index of user ID in likes array: ${index}`);

    if (index === -1) {
      // If the user has not liked the experience before (index is -1), like it.

      // Add the user's ID to the likes array of the experience to indicate they liked it.
      await Experience.updateOne(
        { _id: experienceId },
        { $push: { likes: userId } }
      );

      // console.log("User liked the experience");

      // Respond with a 200 status and the updated experience.
      return res.status(200).json(experience);
    } else {
      // If the user has already liked the experience (index is not -1), unlike it.

      // Remove the user's ID from the likes array of the experience to indicate they unliked it.
      await Experience.updateOne(
        { _id: experienceId },
        { $pull: { likes: userId } }
      );

      // console.log("User unliked the experience");

      // Respond with a 200 status and the updated experience.
      return res.status(200).json(experience);
    }
  } catch (error) {
    // Handle any errors by returning a 500 status and an error message.
    res.status(500).json({ error: "Server Error!" });
  }
});

module.exports = router;
