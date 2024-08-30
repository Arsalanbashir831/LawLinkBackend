const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema(
  {
    lawyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    contractPrice: { 
      type: Number,
      required: true,
      min: 0, 
    },
    dateOfAppointment: {
      type: Date,
      required: true,
    },
    timeOfAppointment: {
      type: String,
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    services: [{
      type: String,
      required: true,
    }],
  },
  {
    timestamps: true,
  }
);

// Unique index to ensure that a lawyer-client pair can't have multiple bookings on the same date and time
BookingSchema.index({ lawyer: 1, client: 1, dateOfAppointment: 1, timeOfAppointment: 1 }, { unique: true });

const Booking = mongoose.model('Booking', BookingSchema);
module.exports = Booking;
