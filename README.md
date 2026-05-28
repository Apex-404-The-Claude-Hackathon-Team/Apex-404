VoiceUpgh
******************************************************************
******************************************************************
Cluster0 username = rde70808_db_user


Cluster0 db password = qyyGHUJ2gR2D4Y86


connection string = mongodb+srv://rde70808_db_user:qyyGHUJ2gR2D4Y86@cluster0.v9tupee.mongodb.net/?appName=Cluster0


connetion string code sample 
"

const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = "mongodb+srv://rde70808_db_user:qyyGHUJ2gR2D4Y86@cluster0.v9tupee.mongodb.net/?appName=Cluster0";

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
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    await client.close();
  }
}
run().catch(console.dir);


"
******************************************************************
******************************************************************
