// Define the schema for a chat between a client and a lawyer
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

const ChatSchema = new mongoose.Schema(
    {
      client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      lawyer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      messages: [MessageSchema], 
      status: {
        type: String,
        enum: ['active', 'closed'], 
        default: 'active',
      },
      lastMessageAt: {
        type: Date,
        default: Date.now,
      },
    },
    {
      timestamps: true, 
    }
  );
  
  // Create the Chat model
  const Chat = mongoose.model('Chat', ChatSchema);
  
  module.exports = Chat;