// Import required modules and libraries
const express = require("express");
const app = express();
app.use(express.json()); // Use the JSON middleware to parse JSON data in requests

const helmet = require("helmet");
app.disable("x-powered-by");
app.use(helmet({ xPoweredBy: false }));
// It is to hind the fact that this website is developed by express.js

const cookieParser = require("cookie-parser");
app.use(cookieParser()); // Use the cookie-parser middleware to handle cookies

const dotenv = require("dotenv");
dotenv.config(); // Load environment variables from a .env file

const mongoose = require("mongoose");
// mongoose automatically sanitize inputs to prevent injection
const MONGO_URI = process.env.MONGODB;
// Connect to MongoDB using the provided URI from .env file and configure some settings
mongoose
  .set("strictQuery", false)
  .connect(MONGO_URI) // Connect to the MongoDB database
  .then((x) => {
    const dbName = x.connections[0].name;
    console.log(`Connected to MongoDB! Database name: "${dbName}"`);
  })
  .catch((error) => {
    console.error("Error connecting to mongo: ", error);
  });

const cors = require("cors");
const corsOptions = {
  origin: [
    "https://comer-app.onrender.com"
  ], // this should match your client application's host
  credentials: true, // this allows the server to accept cookies via CORS
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  allowedHeaders: "content-Type,Authorization",
  exposedHeaders: ["Set-Cookie"],
};

app.use(cors(corsOptions));

// const path = require("path");
// app.use(express.static(path.join(__dirname, ""))); // Serve static files (e.g., images, CSS) from the specified directory

//  // Serve static files from the React app
// app.use(express.static(path.join(__dirname, 'build')));

// // The "catchall" handler: for any request that doesn't
// // match one above, send back React's index.html file.
// app.get('*', (req, res) => {
//   res.sendFile(path.join(__dirname, 'build', 'index.html'));
// });

const usersRoutes = require("./routes/users.routes");
app.use("/users", usersRoutes); // Use the "users" routes for URLs starting with "/users"

const authRoutes = require("./routes/auth.routes");
app.use("/auth", authRoutes); // Use the "auth" routes for URLs starting with "/auth"

const experiencesRoutes = require("./routes/experiences.routes");
app.use("/experiences", experiencesRoutes); // Use the "experiences" routes for URLs starting with "/experiences"

const commentsRoutes = require("./routes/comments.routes");
app.use("/comments", commentsRoutes); // Use the "comments" routes for URLs starting with "/comments"

const PORT = process.env.PORT || 8000; // Set the server's port based on an environment variable or use 8000 as a default

app.listen(PORT, () => {
  console.log(`Server listening on the port ${PORT}`);
  // Start the server and log a message to the console when it's listening
});
