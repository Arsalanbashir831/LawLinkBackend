const express = require('express');
const router = express.Router();
const { addRating } = require('../controllers/RatingController'); // Adjust the path to your controller
const verifyToken = require('../middleware/verifyToken');

router.post('/post', verifyToken,addRating);

module.exports = router;
