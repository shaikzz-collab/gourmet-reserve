const Reservation = require('../models/Reservation');
const Table = require('../models/Table');

// @desc    Create a reservation
// @route   POST /api/reservations
// @access  Private
const createReservation = async (req, res) => {
  try {
    const { table, date, timeSlot, guestsCount } = req.body;

    if (!date || !timeSlot || !guestsCount) {
      return res.status(400).json({ message: 'Please provide reservation date, time slot, and guest count' });
    }

    // Validate guest count
    if (guestsCount <= 0) {
      return res.status(400).json({ message: 'Guest count must be at least 1' });
    }

    // Validate timeSlot
    const validSlots = ['12:00-14:00', '14:00-16:00', '18:00-20:00', '20:00-22:00'];
    if (!validSlots.includes(timeSlot)) {
      return res.status(400).json({ message: 'Invalid time slot selected' });
    }

    let assignedTableId = table;

    if (assignedTableId) {
      // 1. Specific table requested - check capacity and availability
      const targetTable = await Table.findById(assignedTableId);
      if (!targetTable) {
        return res.status(404).json({ message: 'Selected table not found' });
      }

      if (!targetTable.isActive) {
        return res.status(400).json({ message: 'Selected table is currently out of service' });
      }

      // Check table capacity
      if (targetTable.capacity < guestsCount) {
        return res.status(400).json({
          message: `Selected table (${targetTable.tableNumber}) only has a capacity of ${targetTable.capacity} guests. Cannot accommodate ${guestsCount} guests.`,
        });
      }

      // Check for overlapping reservations
      const overlappingReservation = await Reservation.findOne({
        table: assignedTableId,
        date: date,
        timeSlot: timeSlot,
        status: 'confirmed',
      });

      if (overlappingReservation) {
        return res.status(409).json({
          message: `The selected table is already reserved for ${date} during the ${timeSlot} slot.`,
        });
      }
    } else {
      // 2. Auto-allocate table
      // Find all active tables with capacity >= guestsCount, ordered by capacity ascending (to use space efficiently)
      const suitableTables = await Table.find({
        capacity: { $gte: guestsCount },
        isActive: true,
      }).sort({ capacity: 1 });

      if (suitableTables.length === 0) {
        return res.status(400).json({
          message: `No active tables found that can accommodate ${guestsCount} guests.`,
        });
      }

      // Find which tables are already booked for this slot
      const bookedReservations = await Reservation.find({
        date,
        timeSlot,
        status: 'confirmed',
      });

      const bookedTableIds = bookedReservations.map((r) => r.table.toString());

      // Select first available suitable table
      const availableTable = suitableTables.find(
        (t) => !bookedTableIds.includes(t._id.toString())
      );

      if (!availableTable) {
        return res.status(409).json({
          message: `No tables available for ${guestsCount} guests on ${date} during the ${timeSlot} slot.`,
        });
      }

      assignedTableId = availableTable._id;
    }

    // Create reservation
    const reservation = new Reservation({
      user: req.user.id,
      table: assignedTableId,
      date,
      timeSlot,
      guestsCount,
      status: 'confirmed',
    });

    await reservation.save();

    // Populate table and user info for response
    const populatedReservation = await Reservation.findById(reservation._id)
      .populate('table', 'tableNumber capacity')
      .populate('user', 'name email');

    res.status(201).json(populatedReservation);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error creating reservation', error: error.message });
  }
};

// @desc    Get reservations
// @route   GET /api/reservations
// @access  Private
const getReservations = async (req, res) => {
  try {
    let query = {};

    // Customers can only see their own reservations
    if (req.user.role === 'customer') {
      query.user = req.user.id;
    }

    // Support filters (Admin can filter by user, table, date; Customer can filter by date)
    if (req.query.date) {
      query.date = req.query.date;
    }
    if (req.user.role === 'admin') {
      if (req.query.user) {
        query.user = req.query.user;
      }
      if (req.query.table) {
        query.table = req.query.table;
      }
    }

    const reservations = await Reservation.find(query)
      .populate('table', 'tableNumber capacity')
      .populate('user', 'name email')
      .sort({ date: 1, timeSlot: 1 });

    res.json(reservations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error retrieving reservations' });
  }
};

// @desc    Update a reservation
// @route   PUT /api/reservations/:id
// @access  Private
const updateReservation = async (req, res) => {
  try {
    const { table, date, timeSlot, guestsCount, status } = req.body;
    const reservation = await Reservation.findById(req.params.id);

    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found' });
    }

    // Authorization check: customers can only update their own
    if (req.user.role === 'customer' && reservation.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this reservation' });
    }

    // Customers cannot directly approve/confirm/reinstate cancelled reservations or change roles,
    // but they can cancel their own.
    if (req.user.role === 'customer' && status && status !== 'cancelled') {
      return res.status(403).json({ message: 'Customers can only update status to cancelled' });
    }

    const newDate = date || reservation.date;
    const newTimeSlot = timeSlot || reservation.timeSlot;
    const newGuestsCount = guestsCount !== undefined ? guestsCount : reservation.guestsCount;
    const newTableId = table || reservation.table.toString();
    const newStatus = status || reservation.status;

    // Validate guest count if updated
    if (newGuestsCount <= 0) {
      return res.status(400).json({ message: 'Guest count must be at least 1' });
    }

    // Check availability and capacity if table, date, timeSlot, or guest count changes
    // (Only validate if reservation remains/becomes confirmed)
    if (newStatus === 'confirmed') {
      const targetTable = await Table.findById(newTableId);
      if (!targetTable) {
        return res.status(404).json({ message: 'Table not found' });
      }

      if (!targetTable.isActive) {
        return res.status(400).json({ message: 'Table is currently out of service' });
      }

      // Check table capacity
      if (targetTable.capacity < newGuestsCount) {
        return res.status(400).json({
          message: `Selected table (${targetTable.tableNumber}) only has a capacity of ${targetTable.capacity} guests. Cannot accommodate ${newGuestsCount} guests.`,
        });
      }

      // Check for overlapping reservations, excluding the current reservation itself
      const overlappingReservation = await Reservation.findOne({
        table: newTableId,
        date: newDate,
        timeSlot: newTimeSlot,
        status: 'confirmed',
        _id: { $ne: req.params.id }, // Exclude self
      });

      if (overlappingReservation) {
        return res.status(409).json({
          message: `The selected table is already reserved for ${newDate} during the ${newTimeSlot} slot.`,
        });
      }
    }

    // Apply updates
    reservation.date = newDate;
    reservation.timeSlot = newTimeSlot;
    reservation.guestsCount = newGuestsCount;
    reservation.table = newTableId;
    reservation.status = newStatus;

    await reservation.save();

    const updatedReservation = await Reservation.findById(reservation._id)
      .populate('table', 'tableNumber capacity')
      .populate('user', 'name email');

    res.json(updatedReservation);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error updating reservation', error: error.message });
  }
};

module.exports = {
  createReservation,
  getReservations,
  updateReservation,
};
