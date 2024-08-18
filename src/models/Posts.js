const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  post_title: {
    type: String,
    required: true,
    trim: true,
  },
  post_description: {
    type: String,
    required: true,
    trim: true,
  },
  lawType: [{
    type: String,
    trim: true,
  }],
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  }
}, { timestamps: true });

const Post = mongoose.model('Post', postSchema);
module.exports = Post;
