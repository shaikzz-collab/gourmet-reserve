const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    table: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Table',
      required: true,
    },
    date: {
      type: String,
      required: [true, 'Please add a reservation date (YYYY-MM-DD)'],
    },
    timeSlot: {
      type: String,
      required: [true, 'Please add a time slot'],
      enum: ['12:00-14:00', '14:00-16:00', '18:00-20:00', '20:00-22:00'],
    },
    guestsCount: {
      type: Number,
      required: [true, 'Please add guest count'],
      min: [1, 'Guest count must be at least 1'],
    },
    status: {
      type: String,
      required: true,
      enum: ['confirmed', 'cancelled'],
      default: 'confirmed',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes to prevent overlapping reservations at the database level and optimize query performance
reservationSchema.index({ table: 1, date: 1, timeSlot: 1, status: 1 });

module.exports = mongoose.model('Reservation', reservationSchema);
