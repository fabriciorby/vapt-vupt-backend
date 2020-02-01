const router = require('express-promise-router')();
const { alphaVantageAPI, timeRange } = require('../api/alpha-vantage-api')
const loadDB = require('../db');

const tabletojson = require('tabletojson');

const smllURL = 'http://bvmf.bmfbovespa.com.br/indices/ResumoCarteiraTeorica.aspx?Indice=SMLL&idioma=pt-br';

let smllList = [];
let smllSemanal = [];

const sleep = (ms) => {
    return new Promise(resolve => {
        setTimeout(resolve, ms)
    })
}

(async () => {

    await tabletojson.convertUrl(smllURL, (table) => {
        table = table[0];
        table.shift();
        smllList = table.map(item => (
            {
                codigo: item['Código'],
                nome: item['Ação']
            }
        ));
    });

    let db = await loadDB();

    let col = await db.collection('smll_index');

    const insereSMLL = smllList.map(
        async item => {
            try {
                const isUpserted = await col.updateOne(item, { $set: item }, { upsert: true })
                if (isUpserted.upsertedId) { console.log(await col.findOne({ _id: isUpserted.upsertedId._id })) }
            }
            catch (err) { console.error(err) }
        }
    )

    Promise.all(insereSMLL);

    col = await db.collection('smll_cotacoes');
    col.createIndex({ papel: 1 }, { unique: true });

    const insereCotacoes = smllList.map(
        async item => {
            try {
                const result = await alphaVantageAPI(timeRange.weekly, item.codigo + '.SA');
                const isUpserted = await col.updateOne(result, { $set: result }, { upsert: true })
                if (isUpserted.upsertedId) { console.log(await col.findOne({ _id: isUpserted.upsertedId._id }, { data: 0 })) }
            }
            catch (err) { console.error(err) }
        }
    )

    Promise.all(insereCotacoes);

    let listaObjetoVazio = await col.find({ data: { $eq: {} } }, { _id: 0, data: 0 }).toArray();
    console.log(listaObjetoVazio);
    do {

        console.log(listaObjetoVazio.map(item => item.papel));

        const preencheCotacoes = listaObjetoVazio.map(
            async item => {
                try {
                    const result = await alphaVantageAPI(timeRange.weekly, item.papel);
                    if (Object.entries(result.data).length != 0) {
                        console.log(result.papel);
                        if (await col.findOne({papel: result.papel, data: result.data})) {
                            console.log(result.papel + 'já está atualizado!');
                        } else {
                            const isUpserted = await col.updateOne({ papel: result.papel }, { $set: result }, { upsert: true })
                            if (isUpserted.upsertedId) { console.log(await col.findOne({ _id: isUpserted.upsertedId._id }, { data: 0 })) }
                        }
                    }
                }
                catch (err) { console.error(err) }
            }
        )

        Promise.all(preencheCotacoes)

        listaObjetoVazio = await col.find({ data: { $eq: {} } }, { _id: 0, data: 0 }).toArray();

        await sleep(5000);

        console.log('tentando de novo...')
    } while (listaObjetoVazio.length != 0);

})();

const getSemanal = async () => await smllList.map(async item => await alphaVantageAPI(timeRange.weekly, item.codigo + '.SA'))


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