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

router.get('/weekly/all/donchian', async (req, res, next) => {
    const col = await getCollection();
    const data = await col.find({}).project({ _id: 0 }).toArray();
    const info = data.map(i => aplicaDonchian(i));
    res.status(200).send(info);
});

router.get('/weekly/:ticker', async (req, res, next) => {
    const col = await getCollection();
    const ticker = req.params.ticker.toUpperCase();
    const data = await col.findOne({ papel: `${ticker}.SA` }, { projection: { _id: 0 } });
    res.status(200).send(data);
});

router.get('/weekly/:ticker/donchian', async (req, res, next) => {
    const col = await getCollection();
    const ticker = req.params.ticker.toUpperCase();
    const dbData = await col.findOne({ papel: `${ticker}.SA` }, { projection: { _id: 0 } });
    const info = aplicaDonchian(dbData);
    res.status(200).send(info);
});

function aplicaDonchian(dbData) {
    const sortedInfo = dbData.data.sort((a, b) => new Date(b.date) - new Date(a.date));
    const donchianInfo = sortedInfo.map((e, i) => getDonchian(i));
    return getResult();

    function getDonchian(candle) {
        return sortedInfo.slice(candle, candle + 20)
            .reduce((acc, curr) => {
                return {
                    start: Math.max(acc.start, curr.info.high),
                    stop: Math.min(acc.stop, curr.info.low)
                }
            }, {
                start: Number.MIN_SAFE_INTEGER,
                stop: Number.MAX_SAFE_INTEGER
            });
    }

    function getResult() {
        sortedInfo.pop();
        const indexStop = sortedInfo.findIndex((e, i) => e.info.low < donchianInfo[i + 1].stop);
        const indexStart = sortedInfo.findIndex((e, i) => e.info.high > donchianInfo[i + 1].start);
        const result = donchianInfo[0];
        result.preco = parseFloat(sortedInfo[0].info.close);
        result.data = sortedInfo[0].date
        result.papel = dbData.papel;
        result.inTrade = indexStop > indexStart;
        return result;
    }
}

router.get('/all', async (req, res, next) => {
    const db = await loadDB();
    const col = await db.collection('smll_index');
    const data = await col.find({}).project({ _id: 0 }).toArray();
    res.status(200).send(data);
})

router.get('/all/code', async (req, res, next) => {
    const db = await loadDB();
    const col = await db.collection('smll_index');
    const data = (await col.find({}).project({ _id: 0, nome: 0 }).toArray())
        .map(item => item.codigo).sort();
    res.status(200).send(data);
})

module.exports = router;