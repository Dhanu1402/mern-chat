const express = require('express');

const cors = require('cors');

const mongoose = require('mongoose');

const bcrypt = require('bcryptjs');

require('dotenv').config();

const jwt = require('jsonwebtoken');

const User = require('./models/User');

const Message = require('./models/Message');

const ws = require('ws');

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

async function getUserDataFromRequest(req) {
  return new Promise((resolve, reject) => {
    // grab token from cookie and verify it
    const token = req.cookies?.token;
    if (token) {
      jwt.verify(token, jwtSecret, {}, (err, userData) => {
        if (err) throw err;
        resolve(userData);
      });
    } else {
      reject('no token');
    }
  });
}

app.get('/test', (req, res) => {
  res.json('test ok');
});

app.get('/messages/:userId', async (req, res) => {
  const { userId } = req.params;

  const userData = await getUserDataFromRequest(req);

  const ourUserId = userData.userId;

  // grab messags using message model
  const messages = await Message.find({
    sender: { $in: [userId, ourUserId] },
    recipient: { $in: [userId, ourUserId] },
  }).sort({ createdAt: 1 });
  res.json(messages);
});

app.get('/people', async (req, res) => {
  //grab all the people
  const users = await User.find({}, { _id: 1, username: 1 });
  res.json(users);
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

const server = app.listen(4000);

// wss -> web socket server, ws -> web socket
const wss = new ws.WebSocketServer({ server });
wss.on('connection', (connection, req) => {
  // connnection is connection b/w our server and one specific connection
  // grab cookies from request that is having id and username
  const cookies = req.headers.cookie;
  // grab tokens from cookies (seprating it from other cookies)
  if (cookies) {
    const tokenCookieString = cookies
      .split(';')
      .find((str) => str.startsWith('token'));
    if (tokenCookieString) {
      // grab 2nd part of token
      const token = tokenCookieString.split('=')[1];
      if (token) {
        // decode the token having information about user
        jwt.verify(token, jwtSecret, {}, (err, userData) => {
          if (err) throw err;
          // now put this user data into connection
          const { userId, username } = userData;
          connection.userId = userId;
          connection.username = username;
        });
      }
    }
  }

  // what should happen when connection sends message
  connection.on('message', async (message) => {
    const messageData = JSON.parse(message.toString());

    const { recipient, text } = messageData;

    // check availaabiliy of recipients & message
    if (recipient && text) {
      // save message in database
      const messageDoc = await Message.create({
        sender: connection.userId,
        recipient,
        text,
      });

      // sendingn message to recipient
      [...wss.clients]
        .filter((c) => c.userId === recipient)
        .forEach((c) =>
          c.send(
            JSON.stringify({
              text,
              sender: connection.userId,
              recipient,
              _id: messageDoc._id,
            })
          )
        );
    }
  });

  // grab all the clients from websocket server (people who are online)
  [...wss.clients].forEach((client) => {
    client.send(
      JSON.stringify({
        // online is a object that has array of users who are online
        online: [...wss.clients].map((c) => ({
          userId: c.userId,
          username: c.username,
        })),
      })
    );
  });
});
