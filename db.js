const MongoClient = require('mongodb').MongoClient;
const url = 'mongodb://localhost:27017';
const dbName = 'vapt-vupt';

let db;

const loadDB = async () => {

    if (db) {
        return db;
    }

    try {
        const mongoClient = await MongoClient.connect(url, { useUnifiedTopology: true });
        db = mongoClient.db(dbName);
    } catch (err) {
        console.error(err);
    }

    // const col = await db.collection('smll_index');
    // await col.drop();

    return db;

    // const col = await db.collection('smll_index');
    // console.log(await col.insertMany([{ a: 1, b: 1 }, { a: 2, b: 2 }, { a: 3, b: 3 }, { a: 4, b: 4 }], { w: 1 }));
    // console.log(await col.find({}).toArray());
    // console.log(await db.admin().listDatabases());

    // await col.drop();
}

// loadDB();

module.exports = loadDB;