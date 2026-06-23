const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");

const port = process.env.PORT || 8000;

const app = express();

app.use(cors());
app.use(express.json());

const uri = process.env.MONGODB_URI;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// Create a MongoClient with a MongoClientOptions object to set the Stable API version

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const db = client.db("carvo-db");
    const cars = db.collection("cars");

    app.get("/", (req, res) => {
      res.status(200).json({
        success: true,
        message: "Welcome To Carvo Server",
      });
    });

    app.get("/cars", async (req, res) => {
      try {
        const filter = {};
        if (req.query.featured === "true") {
          filter.featured = true;
        }
        const result = await cars.find(filter).toArray();
        return res.status(200).json({
          success: true,
          message: "Requested Cars data retrived successfully",
          data: result,
        });
      } catch (error) {
        console.error("Error fetching cars data: ", error);
        return res.status(500).json({
          success: false,
          message: "An internal server error occured while fetching cars data",
        });
      }
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!",
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log("Server is running on port: ", port);
});
