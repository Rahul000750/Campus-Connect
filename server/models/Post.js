// const mongoose = require('mongoose');

const postSchema = new mongoose.Schema(
  {
    text: { type: String, required: true, trim: true, maxlength: 2000 },
    caption: { type: String, trim: true, maxlength: 2000, default: '' },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    imageUrl: { type: String, trim: true, default: '' },
    image: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

// module.exports = mongoose.model('Post', postSchema);
