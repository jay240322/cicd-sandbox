const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// Serve frontend static assets if the folder exists
const frontendDistPath = path.join(__dirname, '../frontend/dist');
if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));
}

// MongoDB configuration
const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017';
const dbName = process.env.MONGO_DB_NAME || 'auth_practice_db';
const usersCollectionName = 'users';

let dbClient = null;
let db = null;
let usersCollection = null;

// Connect to MongoDB using MongoClient
async function connectDatabase() {
  console.log(`Connecting to MongoDB at: ${mongoUri}...`);
  try {
    dbClient = new MongoClient(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });
    await dbClient.connect();
    db = dbClient.db(dbName);
    usersCollection = db.collection(usersCollectionName);
    
    // Ensure email index is unique
    await usersCollection.createIndex({ email: 1 }, { unique: true });
    
    console.log(`Successfully connected to MongoDB database: "${dbName}"`);
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error.message);
    console.log('Server is running, but database connection is pending. Retrying on API requests...');
  }
}

// Ensure DB is connected middleware
async function ensureDbConnected(req, res, next) {
  if (!dbClient || !db) {
    try {
      await connectDatabase();
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: 'Database connection failed. Please ensure MongoDB is running.',
        error: err.message
      });
    }
  }
  next();
}

// Initialize database connection
connectDatabase();

// Helper: Hash password
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Route: Sign Up
app.post('/api/auth/signup', ensureDbConnected, async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validation
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Name is required' });
    }
    if (!email || !email.trim() || !/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ success: false, message: 'Valid email is required' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existingUser = await usersCollection.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email is already registered' });
    }

    // Insert user into MongoDB
    const hashedPassword = hashPassword(password);
    const newUser = {
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      createdAt: new Date()
    };

    const result = await usersCollection.insertOne(newUser);
    
    res.status(201).json({
      success: true,
      message: 'Account successfully registered!',
      user: {
        id: result.insertedId,
        name: newUser.name,
        email: newUser.email,
        createdAt: newUser.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to register account', error: error.message });
  }
});

// Route: Log In
app.post('/api/auth/login', ensureDbConnected, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await usersCollection.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Validate password hash
    const hashedPassword = hashPassword(password);
    if (user.password !== hashedPassword) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    res.status(200).json({
      success: true,
      message: 'Logged in successfully!',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Login failed', error: error.message });
  }
});

// Route: Get All Users (for dashboard list practice)
app.get('/api/users', ensureDbConnected, async (req, res) => {
  try {
    const users = await usersCollection
      .find({})
      .project({ password: 0 }) // Exclude passwords from lookup
      .sort({ createdAt: -1 })
      .toArray();
    res.status(200).json({ success: true, count: users.length, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to retrieve user registry', error: error.message });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    databaseConnected: !!dbClient && !!db,
    databaseName: dbName
  });
});

// Fallback to React SPA index.html for non-API routes
if (fs.existsSync(frontendDistPath)) {
  app.get('*all', (req, res) => {
    if (!req.path.startsWith('/api/')) {
      res.sendFile(path.join(frontendDistPath, 'index.html'));
    } else {
      res.status(404).json({ success: false, message: 'API route not found' });
    }
  });
}

// Graceful shutdown
process.on('SIGINT', async () => {
  if (dbClient) {
    console.log('Closing MongoDB connection...');
    await dbClient.close();
  }
  process.exit(0);
});

app.listen(port, () => {
  console.log(`Backend authentication server running on port: ${port}`);
});
