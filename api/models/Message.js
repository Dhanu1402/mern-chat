const mongoose = require('mongoose');

const { Schema } = mongoose;

// defining schema
const MessageSchema = new Schema(
  {
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    text: String,
  },
  { timestamps: true }
);

// defining model
const MessageModel = mongoose.model('Message', MessageSchema);

// exporting model
module.exports = MessageModel;
