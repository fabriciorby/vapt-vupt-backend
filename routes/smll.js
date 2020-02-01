const router = require('express-promise-router')();
const { alphaVantageAPI, timeRange } = require('../api/alpha-vantage-api')
const loadDB = require('../db');

router.get('/semanal', async (req, res, next) => {
    const db = await loadDB();
    const col = await db.collection('smll_cotacoes');
    const data = await col.find({}, {_id: 0}).toArray();
    res.status(200).send(data);
});

router.get('/diario', async (req, res, next) => {
    const data = await alphaVantageAPI(timeRange.daily, 'GOLL4.SA');
    res.status(200).send(data);
});

module.exports = router;