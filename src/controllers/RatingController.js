const Rating = require('../models/Ratings'); // Adjust the path to your Rating model
const User = require('../models/User'); // Adjust the path to your User model

const addRating = async (req, res) => {
    try {
        const { lawyerId, rating } = req.body;
        const clientId = req.user._id; // Extracted from the token by middleware

        // Validate rating
        if (rating < 1 || rating > 5) {
            return res.status(400).send({ error: 'Rating must be between 1 and 5' });
        }

        // Fetch users to validate types
        const lawyer = await User.findById(lawyerId);
        const client = await User.findById(clientId);

        if (!lawyer || !client) {
            return res.status(404).send({ error: 'User not found' });
        }

        if (lawyer.type !== 'lawyer') {
            return res.status(400).send({ error: 'Invalid lawyerId' });
        }

        if (client.type !== 'client') {
            return res.status(400).send({ error: 'Invalid clientId' });
        }

        // Check if the client has already rated this lawyer
        const existingRating = await Rating.findOne({ lawyerId, clientId });
        if (existingRating) {
            return res.status(400).send({ error: 'You have already rated this lawyer' });
        }

        // Create and save the new rating
        const newRating = new Rating({ lawyerId, clientId, rating });
        await newRating.save();

        res.status(201).send(newRating);
    } catch (error) {
        console.error('Error adding rating:', error);
        if (error.code === 11000) { // Duplicate key error
            res.status(400).send({ error: 'You have already rated this lawyer' });
        } else {
            res.status(400).send({ error: error.message || 'Failed to add rating' });
        }
    }
};

module.exports = {
    addRating,
};
