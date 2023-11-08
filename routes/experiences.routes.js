const express = require("express");
const Experience = require("../models/Experience.model");
const User = require("../models/User.model.js");
const Availability = require("../models/Availability.model");
const { authenticateUser } = require("../middleware/authMiddleware.js");
const { S3Client } = require("@aws-sdk/client-s3");
const multer = require("multer");
const multerS3 = require("multer-s3");
// const stripe = require("stripe")(process.env.SECRET_STRIPE_KEY);
// I will use stripe to payment
const router = express.Router();

// Get a post
router.get("/:id", async (req, res) => {
  try {
    // Extract the "id" parameter from the URL
    // It is same id = req.params.id || { id } = req.params
    const { id } = req.params;

    const experience = await Experience.findById(id);
    // If no experience is found, return a 404 Not Found response
    if (!experience) {
      return res.status(404).json({ error: "Experience not founded" });
    }
    // Query the database to find availability records related to the experience
    const availability = await Availability.find({ experienceId: id });
    // If no availability records are found, return a 404 Not Found response
    if (!availability) {
      return res
        .status(404)
        .json({ error: "This experience's availability not founded" });
    }

    // Extract the user ID associated with the found experience and save the data userId variable
    const userId = experience.userId;

    // Query the database to find the user (owner) by their ID
    const owner = await User.findById(userId);
    // If no user (owner) is found, return a 404 Not Found response
    if (!owner) {
      return res.status(404).json({ error: "User not founded" });
    }

    // If all database queries are successful, return a 200 OK response
    // with a JSON object containing the experience, owner, and availability
    res.status(200).json({ experience, owner, availability });
  } catch (error) {
    // If an error occurs during the process, return a 500 Internal Server Error response
    res.status(500).json({ error: "Failed to find the post!" });
  }
});

//get a user's all post
router.get("/profile/:id", authenticateUser, async (req, res) => {
  try {
    // Extract the "id" parameter from the URL, which presumably represents the user's ID
    const { id } = req.params;

    // Query the database to find all experiences (posts) associated with the user's ID
    const experience = await Experience.find({ userId: id });

    // Check if there are no experiences found for this user
    if (experience.length === 0) {
      // Return a 300 Multiple Choices status code with a JSON message indicating no experiences found
      return res
        .status(300)
        .json({ error: "No experiences found for this user" });
    }
    // If experiences are found, return a 200 OK status code with the list of experiences as a JSON response
    res.status(200).json(experience);
  } catch (error) {
    res.status(500).json({ error: "Failed to find the user's posts!" });
  }
});

//get random post
router.get("/", async (req, res) => {
  try {
    // Use the MongoDB aggregation framework to query the database
    // Aggregation operations process multiple documents and return computed results.
    const experiences = await Experience.aggregate([
      {
        // First aggregation stage: Match experiences that meet specific criteria
        $match: {
          startDate: { $gte: new Date() }, // Start date is greater than or equal to today
          endDate: { $gte: new Date() }, // End date is greater than or equal to today
        },
      },
      // Second aggregation stage: Randomly sample 20 experiences from the matched results
      { $sample: { size: 20 } },
    ]);
    // Respond with a 200 OK status code and a JSON array containing the random experiences
    res.status(200).json(experiences);
  } catch (error) {
    // If an error occurs during the process, respond with a 500 Internal Server Error status code
    res.status(500).json({ error: "I cannot find all posts!" });
  }
});

// Create a new post

// 1. Defined a storage engine for Multer that specifies where uploaded files should be stored and what name they should be given.
// const storage = multer.diskStorage({
//   destination: (req, file, callback) => {
//     // console.log('Destination:', file);
//     callback(null, "public/experienceImages/");
//   },
//   filename: (req, file, callback) => {
//     // console.log('Filename:', file);
//     callback(null, Date.now() + "-" + file.originalname);
//   },
// });

//2. Created a Multer middleware that uses the storage engine and specifies that only image files should be accepted:
// const upload = multer({
//   storage: storage,
//   fileFilter: (req, file, callback) => {
//     // console.log(req)
//     // console.log('File filter:', file);
//     // I am accpeting only png, jpg and jpeg.
//     if (
//       file.mimetype === "image/png" ||
//       file.mimetype === "image/jpg" ||
//       file.mimetype === "image/jpeg"
//     ) {
//       callback(null, true);
//     } else {
//       callback(new Error("Only image files are allowed!"));
//     }
//   },
// });

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

//3. If files were uploaded, it will set the profilePicture field in the request body to the path of the uploaded file. The path of the uploaded file will be available in req.files.path.
router.post(
  "/createExperience",
  authenticateUser, // Middleware to authenticate the user
  upload.array("files", 5), // Middleware for handling file uploads (up to 5 files)
  async (req, res) => {
    // Asynchronous route handler
    try {
      let imageUrls = []; // Initialize an array to store image URLs
      // If there is req.files(for images)
      if (req?.files && req?.files?.length > 0) {
        // Map the uploaded file paths and replace backslashes with forward slashes
        // Because If do not replace the backslashes, the image url path is not great and cannot display correctly
        imageUrls = req.files.map((file) => file.location);
      }

      // Destructure the following properties from the request body because I need additional process to save the data correctly
      const {
        startTime,
        endTime,
        startDate,
        endDate,
        maxGuest,
        price,
        currency,
      } = req.body;

      // Custom function to parse time in "h:mm A" format to a Date object
      // This is to calculate the running time from startTime "5:30 AM", endTime "8:00 PM"
      // Take a single argument, timeStr, which is a time string in the "h:mm A" format
      const parseTime = (timeStr) => {
        // Split the timeStr into two parts, hours and minutes, by using the colon (":") as a delimiter
        const [hours, minutes] = timeStr.split(":");
        // Split the "hours" part into two sub-parts, h (for the numerical value of hours) and m (for the "AM" or "PM" part)
        const [h, m] = hours.split(" ");
        // Parse the h (hours) as an integer, using base 10
        // hour24 represents the 24-hour format of hours, initially based on the parsed h value
        let hours24 = parseInt(h, 10);
        // Adjust the hours for AM and PM
        // If m is "PM" and hours24 is not already 12, it adds 12 to hours24. This ensures that times like 1 PM become 13:00 in the 24-hour format
        if (m === "PM" && hours24 !== 12) {
          hours24 += 12;
          // If m is "AM" and hours24 is 12 (midnight), it sets hours24 to 0. This ensures that times like 12:30 AM become 0:30 in the 24-hour format
        } else if (m === "AM" && hours24 === 12) {
          hours24 = 0;
        }
        // Create a Date object with the parsed time
        // Set the date, month, and year parts to 0 because the focus is only on the time.
        // Use the adjusted hours24 and the parsed minutes to create a Date object representing the desired time in the 24-hour format.
        return new Date(0, 0, 0, hours24, parseInt(minutes, 10));
      };

      // Calculate runningTime
      // parseTime converts time strings in "h:mm A" format to JavaScript Date objects.
      const start = parseTime(startTime);
      const end = parseTime(endTime);
      // Calculate the runningTime by subtracting the start time from the end time.
      const runningTime = (end - start) / (60 * 1000); // Convert milliseconds into  minutes

      // Check if runningTime is less than or equal to 0, and return an error response if it is
      if (runningTime <= 0) {
        return res
          .status(405)
          .json({ error: "Please check the start time and end time!" });
      }

      // Create a new experience document with various properties
      const newExperience = new Experience({
        userId: req.user.id,
        files: imageUrls,
        runningTime,
        ...req.body, // Include other properties from the request body
      });

      // Save the experience document
      const savedExperience = await newExperience.save();

      // Calculate availability.dateMaxGuestPairs data
      const experienceId = savedExperience._id;
      const dateMaxGuestPairs = [];

      // Loop through each day within the specified date range
      const currentDate = new Date(startDate);
      const endDateMoment = new Date(endDate);

      // This is a while loop that continues to execute as long as the currentDate is less than or equal to the endDateMoment
      // It iterates through a range of dates, from currentDate to endDateMoment
      while (currentDate <= endDateMoment) {
        dateMaxGuestPairs.push({
          startTime,
          endTime,
          maxGuest,
          price,
          currency,
          date: new Date(currentDate), // Clone the date
        });
        currentDate.setDate(currentDate.getDate() + 1); // Move to the next day
      }

      // Create a new availability document
      const newAvailability = new Availability({
        experienceId,
        dateMaxGuestPairs,
      });

      // Save the availability document to the database
      await newAvailability.save();

      // Respond with a success status (200) and the saved experience data
      res.status(200).json(savedExperience);
    } catch (error) {
      // Handle any errors that occur during the process and respond with a 500 status code
      res.status(500).json({ error: "Failed to create a new experience!" });
    }
  }
);

// I made the update functionality each part because I want to make user update what they want only, insead of all together

// update Image
router.put(
  "/:id/updateImage",
  authenticateUser, // Authenticate the user before proceeding
  upload.array("files", 5), // Upload up to 5 files using the "files" field
  async (req, res) => {
    try {
      const { id } = req.params; // Extract the "id" parameter from the request's URL

      // Find the experience with the provided ID in the database
      const experience = await Experience.findById(id);

      // Check if the experience doesn't exist
      if (!experience) {
        return res.status(404).json("The experience cannot be found!");
      }

      // Check if the currently authenticated user is the owner of the experience
      // Because I did use put request using parameter to avoid potential cyber attacks
      // Because some people who know about id information can adjust its data
      if (req.user.id !== experience.userId) {
        return res.status(401).json("You can only update your own experience!");
      }

      let imageUrls = [];
      // Check if there are uploaded files in the request
      if (req?.files && req?.files?.length > 0) {
        // Map the uploaded files to their URLs and replace backslashes with forward slashes
        imageUrls = req?.files?.map((file) => file.location);
      }
      console.log(req.file);

      // Update the experience in the database with the new image URLs finding by id
      await Experience.findByIdAndUpdate(
        id,
        { files: imageUrls },
        {
          new: true,
        }
      );
      // Respond with a success message when the update is complete
      res.status(200).json({ message: "Experience updated successfully" });
    } catch (error) {
      // console.error(error);
      // Respond with an error message when an error occurs during the update
      res.status(500).json({ error: "Failed to update the experience post!" });
    }
  }
);

// Update title
router.put("/:id/updateTitle", authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const experience = await Experience.findById(id);

    if (!experience) {
      return res.status(404).json("The experience cannot be found!");
    }

    // Because I did use put request using parameter to avoid potential cyber attacks
    // Because some people who know about id information can adjust its data
    if (req.user.id !== experience.userId) {
      return res.status(401).json("You can only update your own experience!");
    }

    const { title } = req.body;

    if (title === undefined) {
      return res.status(400).json("Title is required in the request body.");
    }

    await Experience.findByIdAndUpdate(
      id,
      { title },
      {
        new: true,
      }
    );

    res.status(200).json({ message: "Experience updated successfully" });
  } catch (error) {
    // console.error(error);
    res.status(500).json("Failed to update the experience title.");
  }
});

// Update language
router.put("/:id/updateLanguage", authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const experience = await Experience.findById(id);

    if (!experience) {
      return res.status(404).json("The experience cannot be found!");
    }

    if (req.user.id !== experience.userId) {
      return res.status(401).json("You can only update your own experience!");
    }

    const { language } = req.body;

    if (language === undefined) {
      return res
        .status(400)
        .json("Language array is required in the request body.");
    }

    await Experience.findByIdAndUpdate(
      id,
      { language },
      {
        new: true,
      }
    );

    res.status(200).json({ message: "Experience updated successfully" });
  } catch (error) {
    // console.error(error);
    res.status(500).json({
      error: "Failed to update the language array of the experience.",
    });
  }
});

// Update description
router.put("/:id/updateDescription", authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const experience = await Experience.findById(id);

    if (!experience) {
      return res.status(404).json({ error: "The experience cannot be found!" });
    }

    if (req.user.id !== experience.userId) {
      return res.status(401).json("You can only update your own experience!");
    }
    const { description } = req.body;

    if (description === undefined) {
      return res
        .status(400)
        .json({ error: "Description is required in the request body." });
    }

    await Experience.findByIdAndUpdate(
      id,
      { description },
      {
        new: true,
      }
    );

    res.status(200).json({ message: "Experience updated successfully" });
  } catch (error) {
    // console.error(error);
    res
      .status(500)
      .json({ error: "Failed to update the description of the experience." });
  }
});

// Update the perks
router.put("/:id/updatePerks", authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const experience = await Experience.findById(id);

    if (!experience) {
      return res.status(404).json("The experience cannot be found!");
    }

    // Check for authorization if needed
    // Add your authentication and authorization logic here

    const { perks } = req.body;

    if (!perks) {
      return res
        .status(400)
        .json("Perks data is required in the request body.");
    }

    const updatedPerks = {
      food: perks.food,
      transportation: perks.transportation,
      beverage: perks.beverage,
      alcohol: perks.alcohol,
      equipment: perks.equipment,
      others: perks.others,
    };

    await Experience.findByIdAndUpdate(
      id,
      { perks: updatedPerks },
      {
        new: true,
      }
    );

    res.status(200).json({ message: "Experience updated successfully" });
  } catch (error) {
    console.error(error); // Log the error for debugging
    res.status(500).json("Failed to update the perks of the experience.");
  }
});

router.put(
  "/:id/updateGuestRequirements",
  authenticateUser,
  async (req, res) => {
    try {
      const { id } = req.params;
      const experience = await Experience.findById(id);

      if (!experience) {
        return res
          .status(404)
          .json({ error: "The experience cannot be found!" });
      }

      // You can add your authentication and authorization logic here to check permissions.

      const { kidsAllowed, petsAllowed, maxGuest, minimumAge } = req.body;

      // Update the specified fields
      if (minimumAge !== undefined) {
        experience.minimumAge = minimumAge;
      }
      if (kidsAllowed !== undefined) {
        experience.kidsAllowed = kidsAllowed;
      }
      if (petsAllowed !== undefined) {
        experience.petsAllowed = petsAllowed;
      }
      if (maxGuest !== undefined) {
        experience.maxGuest = maxGuest;
      }

      // Save the updated Experience document
      await Experience.findByIdAndUpdate(
        id,
        { kidsAllowed, petsAllowed, maxGuest, minimumAge },
        {
          new: true,
        }
      );

      res.status(200).json({ message: "Experience updated successfully" });
    } catch (error) {
      console.error(error); // Log the error for debugging
      res.status(500).json({ error: "Failed to update the experience flags." });
    }
  }
);

// Define a PUT route to update the tags of an Experience document by ID
router.put("/:id/updateTags", authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const experience = await Experience.findById(id);

    if (!experience) {
      return res.status(404).json({ error: "The experience cannot be found!" });
    }

    const { tags } = req.body;

    // Save the updated Experience document
    await Experience.findByIdAndUpdate(
      id,
      { tags },
      {
        new: true,
      }
    );

    // Return a success response
    res.status(200).json({ message: "Experience updated successfully" });
  } catch (error) {
    console.error(error); // Log the error for debugging
    res
      .status(500)
      .json({ error: "Failed to update the tags of the experience." });
  }
});

// Define a PUT route to update the notice of an Experience document by ID
router.put("/:id/updateNotice", authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const experience = await Experience.findById(id);

    if (!experience) {
      return res.status(404).json({ error: "The experience cannot be found!" });
    }

    const { notice } = req.body;

    // Check if 'notice' is a string
    if (typeof notice !== "string") {
      return res
        .status(400)
        .json({ error: "Invalid 'notice' format. It should be a string." });
    }

    // Save the updated Experience document
    await Experience.findByIdAndUpdate(
      id,
      { notice },
      {
        new: true,
      }
    );

    // Return a success response
    res.status(200).json({ message: "Experience updated successfully" });
  } catch (error) {
    console.error(error); // Log the error for debugging
    res
      .status(500)
      .json({ error: "Failed to update the notice of the experience." });
  }
});

// Define a PUT route to update the cancellation fields of an Experience document by ID
router.put("/:id/updateCancellation", authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const experience = await Experience.findById(id);

    if (!experience) {
      return res.status(404).json({ error: "The experience cannot be found!" });
    }

    const { cancellation1, cancellation2 } = req.body;

    // Check if 'cancellation1' and 'cancellation2' are boolean values
    if (
      typeof cancellation1 !== "boolean" ||
      typeof cancellation2 !== "boolean"
    ) {
      return res.status(400).json({
        error:
          "Invalid 'cancellation' format. Both fields should be boolean values.",
      });
    }

    // Save the updated Experience document
    await Experience.findByIdAndUpdate(
      id,
      {
        cancellation1,
        cancellation2,
      },
      {
        new: true,
      }
    );

    // Return a success response
    res.status(200).json({ message: "Experience updated successfully" });
  } catch (error) {
    console.error(error); // Log the error for debugging
    res.status(500).json({
      error: "Failed to update the cancellation fields of the experience.",
    });
  }
});

// Define a PUT route to update the address and location fields of an Experience document by ID
router.put("/:id/updateLocation", authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const experience = await Experience.findById(id);

    if (!experience) {
      return res.status(404).json({ error: "The experience cannot be found!" });
    }

    const {
      fullAddress,
      address,
      state,
      coordinates,
      longitude,
      latitude,
      country,
      city,
    } = req.body;

    // Save the updated Experience document
    await Experience.findByIdAndUpdate(
      id,
      {
        fullAddress,
        address,
        state,
        coordinates,
        longitude,
        latitude,
        country,
        city,
      },
      {
        new: true,
      }
    );

    // Return a success response
    res.status(200).json({ message: "Experience updated successfully" });
  } catch (error) {
    console.error(error); // Log the error for debugging
    res.status(500).json({
      error:
        "Failed to update the address and location fields of the experience.",
    });
  }
});

// Define a PUT route to update the price and currency fields of an Experience document by ID
router.put("/:id/updatePriceCurrency", authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const experience = await Experience.findById(id);

    if (!experience) {
      return res.status(404).json({ error: "The experience cannot be found!" });
    }

    const { price, currency } = req.body;

    // Save the updated Experience document
    await Experience.findByIdAndUpdate(
      id,
      {
        price,
        currency,
      },
      {
        new: true,
      }
    );

    // Return a success response
    res.status(200).json({ message: "Experience updated successfully" });
  } catch (error) {
    console.error(error); // Log the error for debugging
    res.status(500).json({
      error:
        "Failed to update the price and currency fields of the experience.",
    });
  }
});

// Update availiability
router.put("/:id/updateAvailiability", authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const experience = await Experience.findById(id);

    if (!experience) {
      return res.status(404).json("The experience cannot be found!");
    }

    if (req.user.id !== experience.userId) {
      return res.status(401).json("You can only update your own experience!");
    }

    const { startTime, endTime, startDate, endDate } = req.body;

    // Custom function to parse time in "h:mm A" format to a Date object
    const parseTime = (timeStr) => {
      const [hours, minutes] = timeStr.split(":");
      const [h, m] = hours.split(" ");
      let hours24 = parseInt(h, 10);
      if (m === "PM" && hours24 !== 12) {
        hours24 += 12;
      } else if (m === "AM" && hours24 === 12) {
        hours24 = 0;
      }
      return new Date(0, 0, 0, hours24, parseInt(minutes, 10));
    };

    // Calculate runningTime
    const start = parseTime(startTime);
    const end = parseTime(endTime);
    const runningTime = (end - start) / (60 * 1000); // in minutes

    if (runningTime <= 0) {
      return res.status(405).json("Please check the start time and end time!");
    }

    await Experience.findByIdAndUpdate(
      id,
      {
        runningTime,
        startTime,
        endTime,
        startDate,
        endDate,
      },
      {
        new: true,
      }
    );
    const maxGuest = experience.maxGuest;
    const price = experience.price;
    const currency = experience.currency;

    // Delete previous availability data
    await Availability.findOneAndDelete({ experienceId: id });

    // Create new availability data based on the updated information
    const dateMaxGuestPairs = [];
    const currentDate = new Date(startDate);
    const endDateMoment = new Date(endDate);

    while (currentDate <= endDateMoment) {
      dateMaxGuestPairs.push({
        startTime,
        endTime,
        maxGuest,
        date: new Date(currentDate), // Clone the date
        currency,
        price,
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Create a new availability document
    const newAvailability = new Availability({
      experienceId: id,
      dateMaxGuestPairs,
    });

    // Save the new availability data
    await newAvailability.save();

    res.status(200).json({ message: "Experience updated successfully" });
  } catch (error) {
    console.error(error); // Log the error for debugging
    res
      .status(500)
      .json("Failed to update the language array of the experience.");
  }
});

// Delete a post
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
    // console.log(experience._id);
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

// Get user's all booking list
router.get("/bookedExperience/:userId", authenticateUser, async (req, res) => {
  try {
    const { userId } = req.params;
    // Use Mongoose to find all bookings with the given userId
    const bookings = await Availability.find({ "booking.userId": userId });
    // Respond with the list of bookings
    res.json({ bookings });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to find bookings" });
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

      const existingBooking = availability.booking.find((booking) => {
        return (
          booking.userId === userId && booking.slotId === dateMaxGuestPairId
        );
      });

      if (existingBooking) {
        return res.status(400).json("You have already booked this slot.");
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
        startTime: selectedDateMaxGuestPair.startTime,
        endTime: selectedDateMaxGuestPair.endTime,
        slotId: dateMaxGuestPairId,
        userId,
        experienceTitle: experience.title,
        experienceId: experienceId, // Fix the typo in the field name
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
      (pair) => pair.id === dateMaxGuestPairId
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

router.delete(
  "/cancel-booking/:bookingId",
  authenticateUser,
  async (req, res) => {
    try {
      const { bookingId } = req.params;
      const bookings = await Availability.findOne({ "booking._id": bookingId });

      if (!bookings) {
        return res.status(404).json({ message: "Booking not found" });
      }

      // Find the index of the booking in the 'booking' array
      const bookingIndex = bookings.booking.findIndex(
        (b) => b._id.toString() === bookingId
      );

      if (bookingIndex === -1) {
        return res.status(404).json({ message: "Booking not found" });
      }

      // Find the date of the canceled booking
      const canceledBookingDate = bookings.booking[bookingIndex].slotId;

      // Remove the booking from the 'booking' array
      bookings.booking.splice(bookingIndex, 1);

      // Update the 'dateMaxGuestPairs' array
      bookings.dateMaxGuestPairs = bookings.dateMaxGuestPairs.map((pair) => {
        if (pair._id.toString() === canceledBookingDate.toString()) {
          // Increment 'maxGuest' by 1 for the matching date
          pair.maxGuest += 1;
        }
        return pair;
      });

      // Save the updated document
      await bookings.save();

      return res.json({ message: "Booking canceled successfully" });
    } catch (error) {
      return res.status(500).json({ message: "Failed to cancel the booking" });
    }
  }
);

// Search
// It must be revised
// I did not implet search request to the client
// It should be revised much more
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
