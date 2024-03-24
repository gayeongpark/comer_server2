const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const User = require("../models/User.model.js");
const { verifyEmail } = require("../middleware/authMiddleware.js");
const router = express.Router();

// In this request, I was trying to send sensitive data in req.body, not req.params.
// Because using req.params for such data may expose it in the URL, making it visible in server logs, browser history, or potentially to other users, which is a security risk.
// So I used req.params on get request.

// Sign up
router.post("/signup", async (req, res) => {
  try {
    const { email, password, password2 } = req.body;

    // Basic validation
    if (!email || !password || !password2) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Validate email format
    if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    // Validate password length
    if (password.length < 8 && password.length > 124) {
      return res
        .status(400)
        .json({ error: "Password must be at least 8 characters long" });
    }

    // Validate password2 length
    if (password2.length < 8 && password2.length > 124) {
      return res
        .status(400)
        .json({ error: "Password must be at least 8 characters long" });
    }

    // hash the password and password2(for confirming password) to store them securely in a database.
    const salt = bcrypt.genSaltSync(10);
    // salt contains a random string that is combined with the user's password before hashing.
    // It is to add an additional layer of security to the password hashing process.
    // 10 means that bcrypt will perform 2^10 (1,024) iterations of the underlying algorithm to generate the salt.
    const hash = bcrypt.hashSync(req.body.password, salt);
    // hash contains a hashed password from req.body.password, which is the user's entered password, and a random string from previous step.
    // const hash2 = bcrypt.hashSync(req.body.password2, salt);
    // hash2 contains a hashed password from req.body.password2, which is the user's entered password, and a random string from previous step.
    if (password !== password2) {
      // If password and password2 are not same, it will be error!
      return res.status(400).json({ error: "Password does not match" });
    }

    const user = await User.findOne({ email });
    // Attempt to find if there is same email value in the User data model using the email, which is the user's entered email.
    if (user) {
      // check user existence.
      return res.status(404).json({ error: "User already registered." });
    }
    const token = crypto.randomBytes(32).toString("hex");
    // A token is generated for email verification.
    // Create a verification URL

    const newUser = new User({
      email: req.body.email,
      password: hash,
      // password2: hash2,
      emailToken: token,
      isVerified: false,
      isActive: false,
    });
    // save the generated values in the database
    await newUser.save();

    // send a email for email address verification using nodemailer
    const transporter = nodemailer.createTransport({
      service: "gmail", // This is where the email send to user
      auth: {
        user: process.env.NODEMAILER_ID,
        pass: process.env.NODEMAILER_PASS,
      },
    });

    const url = `https://comer-app.onrender.com/emailVerification/${token}`;
    // This is the URL for email verification with the generated token from previous step
    try {
      await transporter.sendMail({
        from: `"Comer Team" <${process.env.NODEMAILER_ID}>`,
        to: newUser.email,
        subject: "Important: verify your email to use Comer",
        html: `<h3>Hello user!</h3> <div>Comer received a request to create an account for you.</div> <div>Before we proceed, we need you to verify the email address you provided.</div> <div>Click <a href='${url}'>here</a> to verify your email.</div> <div> </div> <div>Thank you,</div> <div>Comer</div>`,
      });
    } catch (error) {
      await newUser.remove();
      // If sending email verification will be failed, the saved user date will be removed.
      // Because it is to let user to make the account again with the same email and password.
      return res.status(400).json({
        error: "Failed to send email verification. Please try again later.",
      });
    }
    res.status(200).json({
      message: "Welcome to Comer! Please check out your email inbox.",
    });
  } catch (error) {
    // Handle any errors by returning a 500 status and an error message.
    res.status(500).json({
      error: "You could not successfully signup, please try it again!",
    });
  }
});

router.get("/verifyEmail/:token", async (req, res) => {
  try {
    const emailToken = req.params.token;
    const user = await User.findOneAndUpdate(
      { emailToken: emailToken },
      { isVerified: true, isActive: true, emailToken: null },
      { new: true }
    );
    // console.log(user);
    if (user) {
      res.status(200).json({ message: "Your email is verified!" });
    } else {
      res.status(404).json({ error: "User not found!" });
    }
  } catch (error) {
    res.status(500).json({ error: "Server Error!" });
  }
});

// Log in
router.post("/login", verifyEmail, async (req, res) => {
  try {
    // Extract the email and password from the request body.
    const { email, password } = req.body;

    // Basic validation
    if (!email || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Validate email format
    if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    // Validate password length
    if (password.length < 8 && password.length > 124) {
      return res
        .status(400)
        .json({ error: "Password must be at least 8 characters long" });
    }

    // Attempt to find a user with the provided email in the database.
    const user = await User.findOne({ email });

    // console.log(user);
    // If no user is found with the provided email, return a 404 response.
    if (!user) {
      return res.status(404).json({ error: "This user was not registered!" });
    }

    // Check if the provided password matches the user's stored password using bcrypt.compare function.
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    // If the password is incorrect, return a 403 response.
    if (!isPasswordCorrect) {
      return res
        .status(403)
        .json({ error: "Wrong password or username, please check out!" });
    }

    // If the password is correct, create access and refresh tokens for the user.
    if (isPasswordCorrect) {
      const accessToken = jwt.sign(
        {
          id: user._id,
          email: user.email,
        },
        process.env.ACCESS_SECRET,
        {
          expiresIn: "30m",
        }
      );
      const refreshToken = jwt.sign(
        {
          id: user._id,
          email: user.email,
        },
        process.env.REFRESH_SECRET,
        {
          expiresIn: "7d",
        }
      );

      // Set cookies for the access and refresh tokens.
      res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: true,
        sameSite: "None",
        maxAge: 1800000,
      });

      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "None",
        maxAge: 604800000,
      });
    }

    // Prepare response data containing user information.
    // Save the resData to sent the data to front end.
    // This is object json format
    const resData = {
      email: user.email,
      id: user.id,
      profilePicture: user.profilePicture,
    };
    // console.log(user)
    // Return a 200 response with the user data.
    res.status(200).json(resData);
  } catch (error) {
    // Handle any errors by returning a 500 status and an error message.
    res.status(500).json({ error: "Server Error!" });
  }
});

// This route handles the request for refreshing an access token using a refresh token.
// Refreshing accessToken using refresh token
router.post("/refreshtoken", async (req, res) => {
  try {
    // Retrieve the refresh token from the request cookies
    const refreshToken = req.cookies["refreshToken"];

    // If no refresh token is provided, return a 401 Unauthorized response
    if (!refreshToken) {
      return res.status(401).json({ error: "You are not authenticated!" });
    }

    // Verify the refresh token using the refresh token secret
    const payload = jwt.verify(refreshToken, process.env.REFRESH_SECRET);
    // console.log(payload);

    // If the verification fails, return a 401 Unauthorized response
    if (!payload) {
      return res.status(401).json({ error: "Unauthorized!" });
    }

    // Generate a new access token based on the payload of the refresh token
    const accessToken = jwt.sign(
      {
        id: payload._id,
        email: payload.email,
      },
      process.env.ACCESS_SECRET,
      {
        expiresIn: "30m", // Set the expiration time for the new access token
      }
    );

    // Set the new access token as a cookie with HTTP-only and a maximum age
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      maxAge: 1800000, // Max age of 30 minutes
    });

    // Return a 202 Accepted response indicating the successful re-issuance of the access token
    res.status(202).json({ message: "Re-issued accessToken" });
  } catch (error) {
    // If any error occurs during the refresh token process, pass it to the error handling middleware
    res.status(500).json({ error: "Server Error!" });
  }
});

// This route handles the user's logout action.
router.post("/logout", async (req, res) => {
  try {
    // Clear the access token and refresh token cookies to log the user out.
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");

    // Respond with a 200 status code and a message to indicate successful logout.
    res.status(200).json({ message: "Completely logout" });
  } catch (error) {
    res.status(500).json({ error: "Server Error!" });
  }
});

// initiating the password reset process.
router.post("/forgotPassword", async (req, res) => {
  try {
    // Extract the user's email from the request body.
    const { email } = req.body;
    // Generate a random token using crypto for password reset.
    const token = crypto.randomBytes(32).toString("hex");
    // const expirationTime = Date.now() + 60000;
    // Check if a user with the provided email exists in the database and contains the data in user variable.
    const user = await User.findOne({ email });
    // If no user is found with the provided email, return a 400 response.
    if (!user) {
      return res.status(400).json({ error: "You are not the joined member!" });
    } else {
      // Assign the generated token to the user's resetPasswordEmailToken field and save it.
      user.resetPasswordEmailToken = token;
      // user.resetPasswordExpires = expirationTime;
      await user.save();
      // Send the password reset email
    }
    // Create a transporter for sending email using nodemailer.
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.NODEMAILER_ID,
        pass: process.env.NODEMAILER_PASS,
      },
    });

    // Define the reset password URL to be sent in the email and contain the url in url variable.
    const url = `https://comer-app.onrender.com/resetPassword/${token}`;
    await transporter.sendMail({
      from: `"Comer Team" <${process.env.NODEMAILER_ID}>`,
      to: email,
      subject: "Ready to reset your password.",
      html: `Click <a href='${url}'>here</a> to reset your password`,
    });
    // Respond with a 200 status and a message indicating that an email has been sent.
    res
      .status(200)
      .json("Please check your email! and then reset your password now!");
  } catch (error) {
    // Handle any errors by returning a 500 status and an error message.
    res.status(500).json({ error: "Server Error!" });
  }
});

// Reset password
router.post("/resetPassword", async (req, res) => {
  try {
    // // Extract the token and new password from the request body.
    const { token, password, password2 } = req.body;
    // Check if the two provided passwords match; if not, return a 400 response.
    if (password !== password2) {
      return res.status(400).json({ error: "Password does not match" });
    }
    // Find a user with the provided resetPasswordEmailToken.
    const user = await User.findOne({
      resetPasswordEmailToken: token,
      // resetPasswordExpires: { $gt: Date.now() },
    });
    if (!user) {
      return res.status(400).json({ error: "Invalid link" });
    }

    // Check if the new password is the same as the old password
    const isSamePreviousPassword = await bcrypt.compare(
      password,
      user.password
    );
    if (isSamePreviousPassword) {
      return res.status(400).json({
        error: "New password must be different from the current password.",
      });
    }
    // Generate salt and hash the new password using bcrypt for security.
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(password, salt);
    // const hash2 = bcrypt.hashSync(req.body.password2, salt);
    // Update the user's password and clear the resetPasswordEmailToken.
    await User.updateOne(
      { email: user.email },
      {
        password: hash,
        // password2: hash2,
        resetPasswordEmailToken: null,
        // resetPasswordExpires: null,
      }
    );
    // Respond with a 202 status indicating successful password update.
    res.status(200).json({ message: "Password updated successfully!" });
  } catch (error) {
    // Handle any errors by returning a 500 status and an error message.
    res.status(500).json({ error: "Server Error!" });
  }
});

module.exports = router;
