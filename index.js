const express = require("express");
const app = express();
const cors = require("cors");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const port = process.env.PORT || 5005;

// middleware
app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.zbch3to.mongodb.net/?retryWrites=true&w=majority&appName=AtlasApp`;

// require('crypto').randomBytes(64).toString('hex') //node
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const userCollection = client.db("taskDb").collection("users");
    const taskCollection = client.db("taskDb").collection("tasks");

    // jwt related api
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1h",
      });
      res.send({ token });
    });

    // middlewares
    const verifyToken = (req, res, next) => {
      // console.log("inside verify token", req.headers.authorization);
      if (!req.headers.authorization) {
        return res.status(401).send({ message: "unauthorized access" });
      }
      const token = req.headers.authorization.split(" ")[1];
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
          return res.status(401).send({ message: "Unauthorized Access" });
        }
        req.decoded = decoded;
        next();
      });
    };

    // task related api
    app.get("/tasks", verifyToken, async (req, res) => {
      const query = { email: req.decoded.email };
      const result = await taskCollection.find(query).toArray();
      console.log(result);
      res.send(result);
    });

    app.get("/tasks/:id", verifyToken, async (req, res) => {
      const query = { _id: new ObjectId(req.params.id) };
      const result = await taskCollection.findOne(query);
      console.log(result);
      res.send(result);
    });

    app.post("/tasks", verifyToken, async (req, res) => {
      const task = req.body;
      const result = await taskCollection.insertOne(task);
      res.send(result);
    });

    app.patch("/tasks/:id", verifyToken, async (req, res) => {
      const item = req.body;
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          title: item.title,
          description: item.description,
          deadline: item.deadline,
          priority: item.priority,
          status: item.status,
        },
      };

      const result = await taskCollection.updateOne(filter, updatedDoc);
      res.send(result);
    });

    app.delete("/tasks/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await taskCollection.deleteOne(query);
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    // console.log(
    //   "Pinged your deployment. You successfully connected to MongoDB!"
    // );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Task Man Server is running");
});

app.listen(port, () => {
  console.log(`TaskMan-Server is running on port ${port}`);
});
