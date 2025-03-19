const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const app = express();
require('dotenv').config();
const port = process.env.PORT || 5000;

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
})

// Middlewares
app.use(cors());
app.use(express.json());
app.use(limiter);

const path = require('path');

const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.bvfwp.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

// API Routes
async function run() {
  try {
    // Connect the client to the server


    const userCollection = client.db('BeansDB').collection("User");

    // Validation middleware for user creation
    const validateUser = [
      body('email').isEmail().normalizeEmail(),
      body('password').isLength({ min: 8 }),
      (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({ errors: errors.array() });
        }
        next();
      }
    ];

    app.post('/user', validateUser, async (req, res) => {
      try {
        const user = req.body;
        const result = await userCollection.insertOne(user);
        res.status(201).send(result);
      } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).send({ error: 'An error occurred while creating the user.' });
      }
    });

    app.get('/loginuser/:email', async (req, res) => {
      try {
        const email = req.params.email;
        const user = await userCollection.findOne({ email: email });
        if (!user) {
          return res.status(404).send({ error: 'User not found' });
        }
        res.send(user);
      } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).send({ error: 'An error occurred while fetching the user.' });
      }
    });

    app.get('/alluser', async (req, res) => {
      try {
        const user = await userCollection.find().toArray();
        res.send(user);
      } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).send({ error: 'An error occurred while fetching all users.' });
      }
    });

    // make moderator api
    app.put('/user/make-moderator/:email', async (req, res) => {
      try {
        const email = req.params.email;
        const filter = { email: email };
        const updateDoc = {
          $set: { role: 'Moderator' },
        };
        const result = await userCollection.updateOne(filter, updateDoc);
        if (result.matchedCount === 0) {
          return res.status(404).send({ error: 'User not found' });
        }
        res.send(result);
      } catch (error) {
        console.error('Error updating user role:', error);
        res.status(500).send({ error: 'An error occurred while updating the user role.' });
      }
    });


  } catch (error) {
    console.error('Error setting up routes:', error);
    process.exit(1);
  }
}



// Connect to MongoDB and initialize routes
async function startServer() {
  try {
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log("Successfully connected to MongoDB!");

    await run();

    // Serve static files after API routes
    app.get('/', (req, res) => {
      res.send('I am From Database!');
    });

    // Serve static files from the React app
    app.use(express.static(path.join(__dirname, '../dist')));

    // Handle all other routes by sending the React app's index.html
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, '../dist', 'index.html'));
    });

    app.listen(port, () => {
      console.log(`Steamy Beans app listening on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();


// Close the MongoDB client when the Node.js process is terminated
const gracefulShutdown = async () => {
  try {
    await client.close();
    console.log('MongoDB connection closed.');
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);


