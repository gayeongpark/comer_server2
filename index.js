// Import required modules and libraries
const express = require("express");
const app = express();
app.use(express.json()); // Use the JSON middleware to parse JSON data in requests

const cookieParser = require("cookie-parser");
app.use(cookieParser()); // Use the cookie-parser middleware to handle cookies

const dotenv = require("dotenv");
dotenv.config(); // Load environment variables from a .env file

const mongoose = require("mongoose");
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
app.use(
  cors({
    credentials: true, // Allow credentials (cookies)
    origin: ["https://comer-experience-app.onrender.com"], // Define the allowed origin for CORS
  })
);

const path = require("path");
app.use(express.static(path.join(__dirname, ""))); // Serve static files (e.g., images, CSS) from the specified directory

// const PORT = process.env.PORT || 8000; // Set the server's port based on an environment variable or use 8000 as a default

app.listen(PORT, () => {
  console.log(
    `Server listening on the port "https://comer-experience-app.onrender.com"`
  );
  // Start the server and log a message to the console when it's listening
});

const usersRoutes = require("./routes/users.routes");
app.use("/users", usersRoutes); // Use the "users" routes for URLs starting with "/users"

const authRoutes = require("./routes/auth.routes");
app.use("/auth", authRoutes); // Use the "auth" routes for URLs starting with "/auth"

const experiencesRoutes = require("./routes/experiences.routes");
app.use("/experiences", experiencesRoutes); // Use the "experiences" routes for URLs starting with "/experiences"

const commentsRoutes = require("./routes/comments.routes");
app.use("/comments", commentsRoutes); // Use the "comments" routes for URLs starting with "/comments"
