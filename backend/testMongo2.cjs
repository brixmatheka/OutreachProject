const { MongoClient, ServerApiVersion } = require('mongodb');

const uri = "mongodb://brixmatheka_db_user:DkDxDaUPJKWzPYVQc@cluster0-shard-00-00.k6ymqn.mongodb.net:27017,cluster0-shard-00-01.k6ymqn.mongodb.net:27017,cluster0-shard-00-02.k6ymqn.mongodb.net:27017/ohc_db?ssl=true&replicaSet=atlas-d8hhbv-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Cluster0";

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        await client.connect();
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        await client.close();
    }
}

run().catch(console.dir);
