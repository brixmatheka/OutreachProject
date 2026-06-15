const { MongoClient, ServerApiVersion } = require('mongodb');
const path = require("node:path");

require("dotenv").config({ path: path.join(__dirname, ".env") });

const uri = process.env.MONGO_URI;
if (!uri) {
    throw new Error("MONGO_URI is required");
}

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
        process.stdout.write("MongoDB ping succeeded.\n");
    } finally {
        await client.close();
    }
}

run().catch((err) => {
    process.stderr.write(JSON.stringify({
        level: "error",
        message: "MongoDB ping failed",
        errorName: err.name,
        errorCode: err.code || "UNKNOWN"
    }) + "\n");
    process.exitCode = 1;
});
