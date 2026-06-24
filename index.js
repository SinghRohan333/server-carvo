const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

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
        // Search by name
        if (req.query.search) {
          filter.carName = { $regex: req.query.search, $options: "i" };
        }

        // Filter by type
        if (req.query.type) {
          filter.carType = req.query.type;
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

    app.get("/cars/:id", async (req, res) => {
      try {
        const id = req.params.id;

        if (!ObjectId.isValid(id)) {
          return res.status(400).json({
            success: false,
            message: "Invalid cars ID format",
          });
        }

        const query = {
          _id: new ObjectId(id),
        };

        const result = await cars.findOne(query);

        if (!result) {
          return res.status(404).json({
            success: false,
            message: "Car not found!",
          });
        } else {
          return res.status(200).json({
            success: true,
            message: "Retrived car details successfully",
            data: result,
          });
        }
      } catch (error) {
        console.error("Error occured during fetching details: ", error);
        return res.status(500).json({
          success: false,
          message: "An internal server error occured during fetching details",
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
