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
    dateOfAppointment: { // Adding the date of appointment field
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true, 
  }
);

BookingSchema.index({ lawyer: 1, client: 1, dateOfAppointment: 1 }, { unique: true }); // Unique index includes dateOfAppointment

const Booking = mongoose.model('Booking', BookingSchema);
module.exports = Booking;
