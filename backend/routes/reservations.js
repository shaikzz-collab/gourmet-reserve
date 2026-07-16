const express = require('express');
const router = express.Router();
const { createReservation, getReservations, updateReservation } = require('../controllers/reservationController');
const { protect } = require('../middleware/auth');

router.route('/')
  .post(protect, createReservation)
  .get(protect, getReservations);

router.route('/:id')
  .put(protect, updateReservation);

module.exports = router;
