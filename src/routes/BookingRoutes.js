const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken'); 
const { getClientBookings, getLawyerBookings, addBooking } = require('../controllers/BookingController');


router.get('/getClientBookings',verifyToken,getClientBookings)
router.get('/getLawyerBookings',verifyToken , getLawyerBookings)
router.post('/addBookings' , verifyToken , addBooking )

module.exports = router;