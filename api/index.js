const express = require('express');

const cors = require('cors');

const mongoose = require('mongoose');

const bcrypt = require('bcryptjs');

require('dotenv').config();

const jwt = require('jsonwebtoken');

const User = require('./models/User');

const cookieParser = require('cookie-parser');

const app = express();

// connecting to database
mongoose.connect(process.env.MONGO_URL, (err) => {
  if (err) throw err;
});

// grabbing jwt secret from .env file
const jwtSecret = process.env.JWT_SECRET;

const bcryptSalt = bcrypt.genSaltSync(10);

app.use(express.json());

app.use(cookieParser());

app.use(
  cors({
    credentials: true,
    origin: process.env.CLIENT_URL,
  })
);

app.get('/test', (req, res) => {
  res.json('test ok');
});

app.get('/profile', (req, res) => {
  // grab token from cookie and verify it
  const token = req.cookies?.token;
  if (token) {
    jwt.verify(token, jwtSecret, {}, (err, userData) => {
      if (err) throw err;
      res.json(userData);
    });
  } else {
    res.status(401).json('no token');
  }
});

app.post('/login', async (req, res) => {
  // grab username and password from request body
  const { username, password } = req.body;
  // find user in database
  const foundUser = await User.findOne({ username });
  if (foundUser) {
    const passOk = bcrypt.compareSync(password, foundUser.password);
    // checking password that user entered with password that is stored in database
    if (passOk) {
      jwt.sign(
        { userId: foundUser._id, username },
        jwtSecret,
        {},
        (err, token) => {
          res.cookie('token', token, { sameSite: 'none', secure: true }).json({
            id: foundUser._id,
          });
        }
      );
    }
  }
});

app.post('/register', async (req, res) => {
  // grab username and password from request body
  const { username, password } = req.body;
  try {
    const createdUser = await User.create({
      username,
      password: bcrypt.hashSync(password, bcryptSalt),
    });
    jwt.sign(
      { userId: createdUser._id, username },
      jwtSecret,
      {},
      (err, token) => {
        if (err) throw err;
        // creating user via cookie and status 201 returns that user was created by returning user id
        res
          .cookie('token', token, { sameSite: 'none', secure: true })
          .status(201)
          .json({
            id: createdUser._id,
          });
      }
    );
    // {} -> is object with empty properties coz jwt.sign() requires 4 arguments
  } catch (err) {
    if (err) throw err;
    res.status(500).json('error');
  }
});

app.listen(4000);
