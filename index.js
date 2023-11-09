const express = require('express')
const cors = require('cors')
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const app = express()
const port = process.env.PORT || 5000


// middleware
app.use(cors({
    origin: [
        "http://localhost:5173",
        "https://job-hunter-b5910.web.app",
        "https://job-hunter-b5910.firebaseapp.com"
    ],
    credentials: true
}))
app.use(express.json())
app.use(cookieParser())




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.uwnroha.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

// middleware created
const logger = async (req, res, next) => {
    console.log("called:", req.host, req.originalUrl);
    next();
};

const verifyToken = async (req, res, next) => {
    const token = req?.cookies.token
    console.log(token);
    if (!token) {
        return res.status(401).send({ message: "unauthorized access" });
    }
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).send({ message: "unauthorized access" });
        }
        req.user = decoded;
        next();
    });
};

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();
        // Send a ping to confirm a successful connection

        const jobsCollection = client.db("jobsCollection").collection('jobs')
        const BidjobsCollection = client.db("jobsCollection").collection('bidJobs')


        // authentication api

        app.post('/jwt', logger, async (req, res) => {
            const user = req.body;
            console.log("user to verify", user);
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "1h" })
            res.cookie("token", token, {
                httpOnly: true,
                secure: true,
                sameSite: "none"
            }
            )
                .send({ success: true })
        })

        app.post('/logout', async (req, res) => {
            const user = req.body;
            res.clearCookie('token', { maxAge: 0 }).send({ success: true })
        })


        // posted job

        app.post("/jobs", async (req, res) => {
            const jobs = req.body
            // console.log(req.user?.email);
            const result = await jobsCollection.insertOne(jobs)
            res.send(result)
        })

        app.get('/jobs', async (req, res) => {
            const result = await jobsCollection.find().toArray();
            res.send(result)

        })

        app.get('/jobs/:id', logger, verifyToken, async (req, res) => {
            const userEmail = req.params.id;
            console.log("heheheee", userEmail, req.user?.email);

            const queryEmail = req.query?.email;
            const tokenEmail = req.user?.email;
            if (queryEmail !== tokenEmail) {
                return res.status(403).send({ message: "forbidden access" });
            }

            const query = { BuyerEmail: userEmail }
            const result = await jobsCollection.find(query).toArray()
            res.send(result)
        })

        app.put('/jobs/:id', async (req, res) => {
            const id = req.params.id
            const data = req.body
            // console.log("id", id,data);
            const filter = { _id: new ObjectId(id) }
            const options = { upsert: true }
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
            const result = await jobsCollection.updateOne(filter, updatedUSer, options)
            res.send(result)

        })

        app.delete('/jobs/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await jobsCollection.deleteOne(query);
            res.send(result)
        })

        // bid job collection

        app.post("/bidJobs", async (req, res) => {
            const jobs = req.body
            const result = await BidjobsCollection.insertOne(jobs)
            res.send(result)
        })


        app.get('/bidJobs', logger, verifyToken, async (req, res) => {
            const filter = req.query
            console.log(filter);
            const query = {}
            const options = {
                sort: {
                    status: filter.sort === 'asc' ? 1 : -1
                }
            }
            const queryEmail = req.query?.email;
            const tokenEmail = req.user?.email;
            if (queryEmail !== tokenEmail) {
                return res.status(403).send({ message: "forbidden access" });
            }

            const result = await BidjobsCollection.find(query, options).toArray();
            console.log("cookiessssss", req.cookies);
            res.send(result)

        })

        app.get('/bidJobs/:id', logger, async (req, res) => {
            const userEmail = req.params.id;
            // console.log("cookiessssss", req.cookies);
            const query = { BuyerEmail: userEmail }
            const result = await BidjobsCollection.find(query).toArray()
            res.send(result)
        })

        app.patch("/bidJobs/:id", async (req, res) => {
            const id = req.params.id;
            const data = req.body
            const filter = { _id: new ObjectId(id) };
            const updatedUSer = {
                $set: {
                    status: data.status,

                },
            };

            const result = await BidjobsCollection.updateOne(filter, updatedUSer)
            res.send(result)

        })












        // await client.db("admin").command({ ping: 1 });
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