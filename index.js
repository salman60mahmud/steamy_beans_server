const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();
require('dotenv').config();
const port = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());



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

async function run() {
  try {
    // Connect the client to the server (optional starting in v4.7)


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
        res.send(result);
      } catch (error) {
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
        const result = await userCollection.updateMany(filter, updateDoc);
        if (result.matchedCount === 0) {
          return res.status(404).send({ error: 'User not found' });
        }
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: 'An error occurred while updating the user role.' });
      }
    });

    // Send a ping to confirm a successful connection
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
    await run();
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
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


