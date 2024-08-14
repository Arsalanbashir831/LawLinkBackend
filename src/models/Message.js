const mongoose = require('mongoose');

// Define the schema for a message within a chat
const MessageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: false, // No need for an _id on each message
  }
);

const Message = mongoose.model('Post', MessageSchema)
module.exports = Message