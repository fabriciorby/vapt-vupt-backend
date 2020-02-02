const MongoClient = require('mongodb').MongoClient;
const url = process.env.DB_URL;
const dbName = process.env.DB_NAME;

let db;

const loadDB = async () => {

    if (db) return db;

    try {
        const mongoClient = await MongoClient.connect(url, { useUnifiedTopology: true });
        db = mongoClient.db(dbName);
    } catch (err) {
        console.error(err);
    }

    return db;
}

module.exports = loadDB;