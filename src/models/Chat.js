// Define the schema for a chat between a client and a lawyer
const mongoose = require('mongoose')
const MessageSchema = require('./Message')
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