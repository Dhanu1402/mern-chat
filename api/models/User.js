const mongoose = require('mongoose');

const { Schema } = mongoose;

// defining schema
const UserSchema = new Schema(
  {
    username: { type: String, unique: true },
    password: String,
  },
  { timestamps: true }
);

// defining model
const UserModel = mongoose.model('User', UserSchema);

// exporting model
module.exports = UserModel;
