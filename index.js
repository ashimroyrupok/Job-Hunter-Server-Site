const express = require('express')
const cors = require('cors')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const app = express()
const port = process.env.PORT || 5000


// middleware
app.use(cors())
app.use(express.json())




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.uwnroha.mongodb.net/?retryWrites=true&w=majority`;

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

        const jobsCollection = client.db("jobsCollection").collection('jobs')
        const BidjobsCollection = client.db("jobsCollection").collection('bidJobs')


        // posted job

        app.post("/jobs", async (req, res) => {
            const jobs = req.body
            const result = await jobsCollection.insertOne(jobs)
            res.send(result)
        })

        app.get('/jobs', async (req, res) => {
            const result = await jobsCollection.find().toArray();
            res.send(result)

        })

        app.get('/jobs/:id', async (req, res) => {
            const userEmail = req.params.id;
            const query = { BuyerEmail: userEmail }
            const result = await jobsCollection.find(query).toArray()
            res.send(result)
        })

        app.put('/jobs/:id', async(req,res)=> {
            const id = req.params.id
            const data = req.body
            // console.log("id", id,data);
            const filter = {_id : new ObjectId(id)}
            const options= {upsert : true}
            const updatedUSer = {
                $set: {
                    jobTitle: data.jobTitle,
                  selectedCategory: data.selectedCategory,
                  minimumPice: data.minimumPice,
                  maximumPrice: data.maximumPrice,
                  deadline: data.deadline,
                  description: data.description,
                },
              };
              const result = await jobsCollection.updateOne(filter,updatedUSer,options)
              res.send(result)

        })

        app.delete('/jobs/:id', async(req,res) => {
            const id = req.params.id;
            const query = {_id : new ObjectId(id)}
            const result = await jobsCollection.deleteOne(query);
            res.send(result)
        })

        // bid job collection

        app.post("/bidJobs", async (req, res) => {
            const jobs = req.body
            const result = await BidjobsCollection.insertOne(jobs)
            res.send(result)
        })


        app.get('/bidJobs', async (req, res) => {
            const result = await BidjobsCollection.find().toArray();
            res.send(result)

        })










        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);




app.get('/', (req, res) => {
    res.send('Job hunter server is running')
})

app.listen(port, () => {
    console.log(`job hunter runnig port is ${port}`);
})