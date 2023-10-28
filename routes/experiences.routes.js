const express = require("express");
const moment = require("moment");
const Experience = require("../models/Experience.model");
const User = require("../models/User.model.js");
const Availability = require("../models/Availability.model");
const { authenticateUser } = require("../middleware/authMiddleware.js");
const multer = require("multer");
const stripe = require("stripe")(process.env.SECRET_STRIPE_KEY);
const router = express.Router();

//get a post
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const experience = await Experience.findById(id);
    if (!experience) {
      return res.status(404).json("Experience not founded");
    }
    const availability = await Availability.find({ experienceId: id });
    if (!availability) {
      return res.status(404).json("This experience's availability not founded");
    }

    const userId = experience.userId;

    const owner = await User.findById(userId);
    if (!owner) {
      return res.status(404).json("User not founded");
    }

    res.status(200).json({ experience, owner, availability });
  } catch (error) {
    res.status(500).json("Failed to find the post!");
  }
});

//get a user's all post
router.get("/profile/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const experience = await Experience.find({ userId: id });
    if (experience.length === 0) {
      return res.status(300).json("No experiences found for this user");
    }
    res.status(200).json(experience);
  } catch (error) {
    res.status(500).json("Failed to find the user's posts!");
  }
});

//get random post
router.get("/", async (req, res) => {
  try {
    const experiences = await Experience.aggregate([
      {
        $match: {
          // startDate: { $eq: new Date() },
          endDate: { $gte: new Date() }, // End date is greater than or equal to today
        },
      },
      { $sample: { size: 20 } },
    ]);
    res.status(200).json(experiences);
  } catch (error) {
    res.status(500).json("I cannot find all posts!");
  }
});

//create a new post

//1. Defined a storage engine for Multer that specifies where uploaded files should be stored and what name they should be given.

const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    // console.log('Destination:', file);
    callback(null, "public/experienceImages/");
  },
  filename: (req, file, callback) => {
    // console.log('Filename:', file);
    callback(null, Date.now() + "-" + file.originalname);
  },
});

//2. Created a Multer middleware that uses the storage engine and specifies that only image files should be accepted:
const upload = multer({
  storage: storage,
  fileFilter: (req, file, callback) => {
    // console.log(req)
    // console.log('File filter:', file);
    if (
      file.mimetype === "image/png" ||
      file.mimetype === "image/jpg" ||
      file.mimetype === "image/jpeg"
    ) {
      callback(null, true);
    } else {
      callback(new Error("Only image files are allowed!"));
    }
  },
});

//3. If files were uploaded, it will set the profilePicture field in the request body to the path of the uploaded file. The path of the uploaded file will be available in req.files.path.
router.post(
  "/createExperience",
  authenticateUser,
  upload.array("files", 5),
  async (req, res) => {
    try {
      let imageUrls = [];
      if (req.files && req.files.length > 0) {
        imageUrls = req.files.map((file) => file.path.replace(/\\/g, "/"));
      }

      const {
        startTime,
        endTime,
        startDate,
        endDate,
        maxGuest,
        price,
        currency,
      } = req.body;

      // Calculate runningTime
      const startMoment = moment(startTime, "h:mm A");
      const endMoment = moment(endTime, "h:mm A");
      const duration = moment.duration(endMoment.diff(startMoment));
      const runningTime = duration.asMinutes();

      if (runningTime <= 0) {
        return res
          .status(405)
          .json("Please check the start time and end time!");
      }

      // Create a new experience document
      const newExperience = new Experience({
        userId: req.user.id,
        files: imageUrls,
        runningTime: runningTime,
        ...req.body,
      });

      // Save the experience document
      const savedExperience = await newExperience.save();

      // Calculate availability data
      const experienceId = savedExperience._id;
      const dateMaxGuestPairs = [];

      const currentDate = moment(startDate);
      const endDateMoment = moment(endDate);

      while (currentDate.isSameOrBefore(endDateMoment)) {
        dateMaxGuestPairs.push({
          startTime,
          endTime,
          maxGuest,
          price,
          currency,
          date: currentDate.toDate(),
        });
        currentDate.add(1, "day");
      }

      // Create a new availability document
      const newAvailability = new Availability({
        experienceId,
        dateMaxGuestPairs,
      });

      // Save the availability document
      await newAvailability.save();

      res.status(200).json(savedExperience);
    } catch (error) {
      res.status(500).json("Failed to create a new experience!");
    }
  }
);

//update a post
router.put(
  "/:id/updateExperience",
  authenticateUser,
  upload.array("files", 5),
  async (req, res) => {
    try {
      const { id } = req.params;
      const experience = await Experience.findById(id);
      if (!experience) {
        return res.status(404).json("The experience cannot be found!");
      }
      if (req.user.id !== experience.userId) {
        return res.status(401).json("You can only update your own experience!");
      }
      let imageUrls = [];
      if (req.files && req.files.length > 0) {
        imageUrls = req.files.map((file) => file.path.replace(/\\/g, "/"));
      }
      const {
        startTime,
        endTime,
        startDate,
        endDate,
        maxGuest,
        price,
        currency,
      } = req.body;

      const updatedExperience = { files: imageUrls, ...req.body };

      if (startTime && endTime) {
        const startMoment = moment(startTime, "h:mm A");
        const endMoment = moment(endTime, "h:mm A");
        const duration = moment.duration(endMoment.diff(startMoment));
        const runningTime = duration.asMinutes();
        if (runningTime <= 0) {
          return res.status(405).json("Please check the start and end times!");
        }
        updatedExperience.runningTime = runningTime;
      }

      const savedExperience = await Experience.findByIdAndUpdate(
        id,
        updatedExperience,
        {
          new: true,
        }
      );

      // Update availability data
      const experienceId = savedExperience._id;
      const dateMaxGuestPairs = [];

      const currentDate = moment(startDate, moment.ISO_8601); // Start date of the experience
      const endDateMoment = moment(endDate, moment.ISO_8601); // End date of the experience

      while (currentDate.isSameOrBefore(endDateMoment)) {
        dateMaxGuestPairs.push({
          date: currentDate.toDate(),
          startTime,
          endTime,
          maxGuest,
          price,
          currency,
        });
        currentDate.add(1, "day");
      }

      // Find the corresponding availability document and update it
      const availability = await Availability.findOne({ experienceId });
      if (availability) {
        availability.dateMaxGuestPairs = dateMaxGuestPairs;
        await availability.save();
      }

      res.status(200).json(savedExperience);
    } catch (error) {
      res.status(500).json("Failed to update the experience post!");
    }
  }
);

//delete a post
router.delete("/deleteAExperience/:id", authenticateUser, async (req, res) => {
  try {
    // console.log('deleting an experience for now');
    const { id } = req.params;
    const experience = await Experience.findById(id);
    // console.log(experience);
    if (!experience) {
      res.status(404).json("The experience cannot be found!");
    }
    if (req.user.id === experience.userId) {
      await Experience.findByIdAndDelete(req.params.id);
      res.status(200).json("The experience has been deleted.");
    } else {
      res.status(500).json("You can delete only your experience!");
    }
    const availability = await Availability.findOneAndDelete({
      experienceId: experience.id,
    });
    if (!availability) {
      res.status(404).json("I cannot find the availiable slot!");
    }
  } catch (error) {
    res.status(500).json("Failed to delete the experience post!");
  }
});

//get user's all booking list
router.get('/BookedExperience/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    // Use Mongoose to find all bookings with the given userId
    const bookings = await Availability.find({ 'booking.userId': userId });

    // Respond with the list of bookings
    res.json({ bookings });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to find bookings' });
  }
});

//likes post
router.put(":id/experience/like", authenticateUser, async (req, res) => {
  try {
    const { id } = req.params.id;
    const { userId } = req.body;
    const exeperience = await Experience.findById(id);
    if (!exeperience.likes.includes(userId)) {
      await post.updateOne({ $push: { likes: userId } });
      res.status(200).json("Post liked");
    } else {
      await post.updateOne({ $pull: { likes: userId } });
      res.status(200).json("Post Unliked");
    }
  } catch (error) {
    res.status(500).json("Failed to give a like to the post!");
  }
});

router.post(
  "/booking/create-payment-intent",
  authenticateUser,
  async (req, res) => {
    try {
      const { experienceId, dateMaxGuestPairId, userEmail, userId } = req.body;
      const experience = await Experience.findById(experienceId);

      if (!experience) {
        return res.status(400).json("The experience cannot be found!");
      }

      const availability = await Availability.findOne({
        experienceId: experience.id,
      });

      if (!availability) {
        return res.status(400).json("The slot cannot be found!");
      }

      // Find the specific dateMaxGuestPair using its ID
      const selectedDateMaxGuestPair = availability.dateMaxGuestPairs.find(
        (pair) => pair._id.toString() === dateMaxGuestPairId
      );

      if (!selectedDateMaxGuestPair) {
        return res
          .status(400)
          .json("The selected dateMaxGuestPair cannot be found!");
      }

      // Decrease maxGuest by one
      if (selectedDateMaxGuestPair.maxGuest > 0) {
        selectedDateMaxGuestPair.maxGuest -= 1;
      } else {
        return res
          .status(400)
          .json("No more available maxGuest for this slot.");
      }

      // Create a new booking entry using req.body data
      const newBooking = {
        date: selectedDateMaxGuestPair.date,
        slotId: dateMaxGuestPairId,
        userId,
        experienceIdId: experienceId, // Fix the typo in the field name
        userEmail,
      };

      // Push the new booking into the booking array
      availability.booking.push(newBooking);

      // Save the updated availability document
      await availability.save();

      // You can include Stripe payment logic here if needed

      // Send a response back to the client
      res.json({ message: "Booking successful" });
    } catch (error) {
      res.status(500).json("Server error!");
    }
  }
);

// Cancel a booking and open up a slot
router.post("/booking/cancel-booking", authenticateUser, async (req, res) => {
  try {
    const { experienceId, dateMaxGuestPairId, userId } = req.body;

    const availability = await Availability.findOne({ experienceId });

    if (!availability) {
      return res.status(400).json("The slot cannot be found!");
    }

    // Find the specific dateMaxGuestPair using its ID
    const selectedDateMaxGuestPair = availability.dateMaxGuestPairs.find(
      (pair) => pair._id.toString() === dateMaxGuestPairId
    );

    if (!selectedDateMaxGuestPair) {
      return res
        .status(400)
        .json("The selected dateMaxGuestPair cannot be found!");
    }

    // Check if the user had previously booked this slot
    const bookedSlotIndex = availability.booking.findIndex((booking) => {
      return booking.slotId === dateMaxGuestPairId && booking.userId === userId;
    });

    if (bookedSlotIndex === -1) {
      return res.status(400).json("You haven't booked this slot.");
    }

    // Increase maxGuest by one
    selectedDateMaxGuestPair.maxGuest += 1;

    // Remove the booking entry for this user
    availability.booking.splice(bookedSlotIndex, 1);

    // Save the updated availability document
    await availability.save();

    // You can include refund logic or other actions as needed

    // Send a response back to the client
    res.json({ message: "Booking canceled successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json("Server error!");
  }
});

//get posts by tags
//It must be revised
router.get("/tags", async (req, res, next) => {
  const tags = req.query.tags.split(",");
  try {
    const exeperience = await Experience.find({ tags: { $in: tags } }).limit(
      20
    );
    res.status(200).json(exeperience);
  } catch (error) {
    next(error);
  }
});

//search
//It must be revised
router.get("/search", async (req, res, next) => {
  try {
    const { city, startDate, endDate } = req.query;
    const experience = await Experience.find({
      city: { $regex: city, $options: "i" },
      startDate: { $gte: startDate },
      endDate: { $lte: endDate },
    }).limit(40);
    res.status(200).json(experience);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
