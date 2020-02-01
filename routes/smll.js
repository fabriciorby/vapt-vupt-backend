const router = require('express-promise-router')();
const loadDB = require('../db');

const getCollection = async () => {
    const db = await loadDB();
    return await db.collection('smll_cotacoes');
}

router.get('/weekly/all', async (req, res, next) => {
    const col = await getCollection();
    const data = await col.find({}).project({ _id: 0 }).toArray();
    res.status(200).send(data);
});

router.get('/weekly/:ticker', async (req, res, next) => {
    const col = await getCollection();
    const data = await col.findOne({ papel: `${req.params.ticker}.SA` }, { projection: { _id: 0 } });
    res.status(200).send(data);
});

router.get('/all', async (req, res, next) => {
    const db = await loadDB();
    const col = await db.collection('smll_index');
    const data = await col.find({}).project({ _id: 0 }).toArray();
    res.status(200).send(data);
})

router.get('/all/code', async (req, res, next) => {
    const db = await loadDB();
    const col = await db.collection('smll_index');
    const data = await col.find({}).project({ _id: 0, nome: 0 }).toArray().map(item => item.codigo).sort();
    res.status(200).send(data);
})

module.exports = router;