const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const User = require('../models/User');
const Table = require('../models/Table');

let mongoServer = null;

const seedDatabase = async () => {
  try {
    // 1. Seed Tables if none exist
    const tableCount = await Table.countDocuments();
    if (tableCount === 0) {
      console.log('Seeding default tables...');
      const defaultTables = [
        { tableNumber: 'Table 1', capacity: 2 },
        { tableNumber: 'Table 2', capacity: 2 },
        { tableNumber: 'Table 3', capacity: 4 },
        { tableNumber: 'Table 4', capacity: 4 },
        { tableNumber: 'Table 5', capacity: 6 },
        { tableNumber: 'Table 6', capacity: 6 },
        { tableNumber: 'Table 7', capacity: 8 },
        { tableNumber: 'Table 8', capacity: 8 },
      ];
      await Table.insertMany(defaultTables);
      console.log('Default tables seeded successfully.');
    }

    // 2. Seed Default Users if none exist
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('Seeding default users...');
      
      // Default Admin
      const admin = new User({
        name: 'Restaurant Admin',
        email: 'admin@restaurant.com',
        password: 'adminpassword', // Will be hashed via pre-save hook
        role: 'admin',
      });
      await admin.save();

      // Default Customer
      const customer = new User({
        name: 'John Doe',
        email: 'customer@gmail.com',
        password: 'customerpassword', // Will be hashed via pre-save hook
        role: 'customer',
      });
      await customer.save();

      console.log('Default users (Admin and Customer) seeded successfully.');
    }
  } catch (error) {
    console.error(`Error seeding database: ${error.message}`);
  }
};

const connectDB = async () => {
  try {
    let dbUrl = process.env.MONGODB_URI;

    if (!dbUrl) {
      console.log('No MONGODB_URI found in environment. Checking local MongoDB service on port 27017...');
      const localUrl = 'mongodb://127.0.0.1:27017/gourmet-reserve';
      try {
        // Try to connect to local MongoDB service with a short selection timeout (2s)
        const conn = await mongoose.connect(localUrl, { serverSelectionTimeoutMS: 2000 });
        console.log(`Connected to local MongoDB service: ${conn.connection.host}`);
        await seedDatabase();
        return;
      } catch (localErr) {
        console.log('Local MongoDB service is not responding. Falling back to in-memory MongoDB Server...');
        mongoServer = await MongoMemoryServer.create();
        dbUrl = mongoServer.getUri();
        console.log(`In-memory MongoDB server started at: ${dbUrl}`);
      }
    }

    const conn = await mongoose.connect(dbUrl);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Run seed logic
    await seedDatabase();
  } catch (error) {
    console.error(`Database connection error: ${error.message}`);
    process.exit(1);
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    if (mongoServer) {
      await mongoServer.stop();
      console.log('In-memory MongoDB server stopped.');
    }
  } catch (error) {
    console.error(`Error disconnecting database: ${error.message}`);
  }
};

module.exports = { connectDB, disconnectDB };
