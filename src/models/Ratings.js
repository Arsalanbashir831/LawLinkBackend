const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema({
    lawyerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    clientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        
    },
    rating: {
        type: Number,
        required: true,
        min: 1, // Minimum rating
        max: 5, // Maximum rating
    },
}, {
    timestamps: true, 
});

const Rating = mongoose.model('Rating', ratingSchema);

module.exports = Rating;
