const jwt = require("jsonwebtoken");
const User = require("../models/User.model");

// Middleware for authenticating user using JWT access token
const authenticateUser = async (req, res, next) => {
  try {
    const authAccessToken = req.cookies["accessToken"];
    if (!authAccessToken) {
      // If no access token is found in cookies, return a 401 Unauthorized response
      return res.status(401).json("Access token not found!");
    }
    // Verify the access token using the secret key
    const payload = jwt.verify(authAccessToken, process.env.ACCESS_SECRET);

    if (!payload) {
      // If verification fails, return a 401 Unauthorized response
      return res.status(401).json("Unauthorized!");
    }
    // Find the user based on the payload's ID
    const user = await User.findById(payload.id);
    if (!user || (!user.isVerified && !user.isActive)) {
      // If the user does not exist or user's email is not verified or not acive state, return a 401 Unauthorized response
      return res.status(401).json("Unauthorized!");
    }
    // Attach the user object to the req object for use in subsequent middleware and routes
    req.user = user;
    next();
    //next() is a function that is used to pass control to the next middleware function in the middleware stack.
  } catch (error) {
    // If any error occurs during authentication, pass it to the error handling middleware
    next(error);
  }
};

// Middleware for verifying if a user's email is active and verified
const verifyEmail = async (req, res, next) => {
  try {
    // Find a user based on the email in the request body
    const user = await User.findOne({ email: req.body.email });
    if (!user.isActive) {
      // If the user's account is inactive, return a 404 Not Found response
      res.status(404).json("This is an inactive account.");
    }
    if (user.isVerified && user.isActive) {
      // If the user's email is verified and the account is active, proceed to the next middleware/route
      next();
      // When a middleware function is called and it has finished its work, it can call next() to instruct Express to move to the next middleware function in the sequence.
      // If next() is not called, the application flow will stop at the current middleware, and no further middleware or routes will be executed.
    } else {
      // If the email is not verified, return a 406 response with a message to check the email inbox
      return res
        .status(406)
        .json("Please check your email inbox to verify your account!");
    }
  } catch (error) {
    // If any error occurs during email verification, pass it to the error handling middleware
    next(error);
  }
};

module.exports = { authenticateUser, verifyEmail };
