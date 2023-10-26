const jwt = require('jsonwebtoken');
const User = require('../models/User.model');

const authenticateUser = async (req, res, next) => {
  try {
    const authAccessToken = req.cookies['accessToken'];
    if (!authAccessToken) {
      return res.status(401).json('Access token not found!');
    }
    const payload = jwt.verify(authAccessToken, process.env.ACCESS_SECRET);

    if (!payload) {
      return res.status(401).json('Unauthorized!');
    }
    const user = await User.findById(payload.id);
    if (!user) {
      return res.status(401).json('Unauthorized!');
    }
    req.user = user;
    // console.log(req.user)
    //By attaching the user object to the req object, the user object can be accessed in subsequent middleware functions or route handlers that use the same req object.
    //This means that the authenticated user's details can be easily accessed by any middleware functions or route handlers that follow the authentication middleware.
    next();
  } catch (error) {
    next(error);
  }
};

const verifyEmail = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user.isActive) {
      res.status(404).json('This is an inactive account.');
    }
    if (user.isVerified & user.isActive) {
      next();
    } else {
      return res
        .status(406)
        .json('please check your email inbox to verify your account!');
    }
  } catch (error) {
    next(error);
  }
};

module.exports = { authenticateUser, verifyEmail };
