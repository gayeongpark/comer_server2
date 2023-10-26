const express = require('express');
const app = express();
app.use(express.json());

const cookieParser = require('cookie-parser');
app.use(cookieParser());

const dotenv = require('dotenv');
dotenv.config();

const mongoose = require('mongoose');
const MONGO_URI = process.env.MONGODB;
mongoose
  .set('strictQuery', false)
  .connect(MONGO_URI)
  .then((x) => {
    const dbName = x.connections[0].name;
    console.log(`Connected to MongoDB! Database name: "${dbName}"`);
  })
  .catch((err) => {
    console.error('Error connecting to mongo: ', err);
  });

const cors = require('cors');
app.use(
  cors({
    credentials: true,
    origin: 'http://localhost:3000',
  })
);

const path = require('path');
app.use(express.static(path.join(__dirname, '')));


const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log(`Server listening on the port http://localhost:${PORT}`);
});

const usersRoutes = require('./routes/users.routes');
app.use('/users', usersRoutes);

const authRoutes = require('./routes/auth.routes');
app.use('/auth', authRoutes);

const experiencesRoutes = require('./routes/experiences.routes');
app.use('/experiences', experiencesRoutes);

const commentsRoutes = require('./routes/comments.routes');
app.use('/comments', commentsRoutes);