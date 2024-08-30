const Booking = require('../models/Booking');
const User = require('../models/User');
const Rating = require('../models/Ratings');

const addBooking = async (req, res) => {
    try {
        const { lawyerId, contractPrice, dateOfAppointment, services, location, timeOfAppointment } = req.body;
        const clientId = req.user._id;

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

        const existingBooking = await Booking.findOne({
            lawyer: lawyerId,
            client: clientId,
            dateOfAppointment,
         
        });

        if (existingBooking) {
            await Booking.findByIdAndDelete(existingBooking._id);
        }

        // Create the new booking
        const newBooking = new Booking({
            lawyer: lawyerId,
            client: clientId,
            contractPrice,
            dateOfAppointment,
            services,
            location,
            timeOfAppointment
        });

        await newBooking.save();

        res.status(201).send(newBooking);
    } catch (error) {
        console.error('Error adding booking:', error);
        res.status(400).send({ error: error.message || 'Failed to add booking' });
    }
};

const getClientBookings = async (req, res) => {
    try {
        const clientId = req.user._id;
        const client = await User.findById(clientId);

        if (!client) {
            return res.status(404).send({ error: 'Client not found' });
        }

        if (client.type !== 'client') {
            return res.status(400).send({ error: 'Invalid clientId' });
        }

        // Find all bookings for this client
        const bookings = await Booking.find({ client: clientId })
            .populate('lawyer', 'username email profilePic ')
            .lean(); // Use lean to get plain JavaScript objects

        for (let booking of bookings) {
            // Check if the booking has been rated
            const rating = await Rating.findOne({
                clientId: clientId,
                lawyerId: booking.lawyer._id,
            });

            booking.isRatedBooking = !!rating; // Add isRatedBooking field
            booking.timeOfAppointment = booking.timeOfAppointment;
            booking.location = booking.location;
            booking.services = booking.services;
        }

        res.status(200).send(bookings);
    } catch (error) {
        console.error('Error fetching client bookings:', error);
        res.status(400).send({ error: error.message || 'Failed to fetch client bookings' });
    }
};

const getLawyerBookings = async (req, res) => {
    try {
        const lawyerId = req.user._id; // Extracted from the token by middleware

        // Validate the lawyer
        const lawyer = await User.findById(lawyerId);

        if (!lawyer) {
            return res.status(404).send({ error: 'Lawyer not found' });
        }

        if (lawyer.type !== 'lawyer') {
            return res.status(400).send({ error: 'Invalid lawyerId' });
        }

        // Find all bookings for this lawyer
        const bookings = await Booking.find({ lawyer: lawyerId })
            .populate('client', 'username email profilePic')
            .lean(); // Use lean to get plain JavaScript objects

        for (let booking of bookings) {
            // Check if the booking has been rated
            const rating = await Rating.findOne({
                clientId: booking.client._id,
                lawyerId: lawyerId,
            });

            booking.isRatedBooking = !!rating; // Add isRatedBooking field
            booking.timeOfAppointment = booking.timeOfAppointment;
            booking.location = booking.location;
            booking.services = booking.services;
        }

        res.status(200).send(bookings);
    } catch (error) {
        console.error('Error fetching lawyer bookings:', error);
        res.status(400).send({ error: error.message || 'Failed to fetch lawyer bookings' });
    }
};

module.exports = {
    addBooking,
    getClientBookings,
    getLawyerBookings,
};
