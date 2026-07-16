const Table = require('../models/Table');
const Reservation = require('../models/Reservation');

// @desc    Get all tables
// @route   GET /api/tables
// @access  Private (Authenticated users)
const getTables = async (req, res) => {
  try {
    const tables = await Table.find({}).sort({ tableNumber: 1 });
    res.json(tables);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error retrieving tables' });
  }
};

// @desc    Create a table
// @route   POST /api/tables
// @access  Private/Admin
const createTable = async (req, res) => {
  try {
    const { tableNumber, capacity } = req.body;

    if (!tableNumber || !capacity) {
      return res.status(400).json({ message: 'Please provide table number and capacity' });
    }

    // Check if table number already exists
    const tableExists = await Table.findOne({ tableNumber });
    if (tableExists) {
      return res.status(400).json({ message: 'Table number already exists' });
    }

    const table = await Table.create({
      tableNumber,
      capacity,
    });

    res.status(201).json(table);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error creating table', error: error.message });
  }
};

// @desc    Update a table
// @route   PUT /api/tables/:id
// @access  Private/Admin
const updateTable = async (req, res) => {
  try {
    const { tableNumber, capacity, isActive } = req.body;
    const table = await Table.findById(req.params.id);

    if (!table) {
      return res.status(404).json({ message: 'Table not found' });
    }

    // Check if new table number conflicts with another table
    if (tableNumber && tableNumber !== table.tableNumber) {
      const tableNumberConflict = await Table.findOne({ tableNumber });
      if (tableNumberConflict) {
        return res.status(400).json({ message: 'Table number already exists' });
      }
      table.tableNumber = tableNumber;
    }

    if (capacity !== undefined) {
      table.capacity = capacity;
    }

    if (isActive !== undefined) {
      table.isActive = isActive;
    }

    const updatedTable = await table.save();
    res.json(updatedTable);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error updating table', error: error.message });
  }
};

// @desc    Delete a table
// @route   DELETE /api/tables/:id
// @access  Private/Admin
const deleteTable = async (req, res) => {
  try {
    const table = await Table.findById(req.params.id);

    if (!table) {
      return res.status(404).json({ message: 'Table not found' });
    }

    // Prevent deletion if there are active confirmed reservations for this table
    const activeReservations = await Reservation.findOne({
      table: table._id,
      status: 'confirmed',
    });

    if (activeReservations) {
      return res.status(400).json({
        message: 'Cannot delete table. It has active confirmed reservations. Please cancel or update those reservations first.',
      });
    }

    await Table.findByIdAndDelete(req.params.id);
    res.json({ message: 'Table removed successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error deleting table', error: error.message });
  }
};

module.exports = {
  getTables,
  createTable,
  updateTable,
  deleteTable,
};
