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
    await client.connect();

    const userCollection = client.db('BeansDB').collection("User");

    app.post('/user', async (req, res) => {
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
        res.send(user);
      } catch (error) {
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
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: 'An error occurred while updating the user role.' });
      }
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
  }
}

run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(port, () => {
  console.log(`Steamy Beans app listening on port ${port}`);
});

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../dist')));

// Handle all other routes by sending the React app's index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist', 'index.html'));
});

// Close the MongoDB client when the Node.js process is terminated
process.on('SIGINT', async () => {
  await client.close();
  process.exit();
});

process.on('SIGTERM', async () => {
  await client.close();
  process.exit();
});


