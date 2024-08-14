const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { MONGODB_URL, PORT } = require('./Constants');
const userRoutes = require('./routes/UserRoutes')
const postRoutes = require('./routes/PostRoutes')
const ratingRoutes = require('./routes/RatingRoutes')
const bookingRoute = require('./routes/BookingRoutes')
const app = express();
app.use(cors());
app.use(express.json()); 
const mongoURI = `${MONGODB_URL}`;
mongoose.connect(mongoURI)
.then(() => {
    console.log('Connected to MongoDB');
})
.catch((err) => {
    console.error('Error connecting to MongoDB:', err);
});

// Your routes would go here
app.get('/', (req, res) => {
    res.send('Hello World');
});
app.use('/api/v1/users' , userRoutes)
app.use('/api/v1/lawyer' , postRoutes )
app.use('/api/v1/ratings', ratingRoutes)
app.use('/api/v1/bookings',bookingRoute )
// Start server
const port = PORT;
app.listen(port, () => {
    console.log('App listening on port', port);
});
