
const { alphaVantageAPI, timeRange } = require('./api/alpha-vantage-api');
const { convertUrl } = require('tabletojson');
const loadDB = require('./db');

const smallCapsIndexURL = 'http://bvmf.bmfbovespa.com.br/indices/ResumoCarteiraTeorica.aspx?Indice=SMLL&idioma=pt-br';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

const toSmallCapIndexSchema = item => ({ codigo: item['Código'], nome: item['Ação'] })

const getSmallCapsIndexFromDB = async () => {
    console.log(`Getting the last SMLL Index from our DB...`);
    const db = await loadDB();
    const col = await db.collection('smll_index');
    const smallCapsIndex = await col.find().toArray();
    return smallCapsIndex;
}

const getSmallCapsIndexAndSync = async () => {
    let smallCapsIndex;
    console.log(`Getting SMLL Index from BVMF website...`);
    let table = await convertUrl(smallCapsIndexURL);
    table = table[0];
    if (table) {
        table.shift();
        smallCapsIndex = table.map(toSmallCapIndexSchema);
        await syncSmallCapsIndexIntoDB(smallCapsIndex);
    } else {
        console.log(`BVMF website is down.`);
        smallCapsIndex = await getSmallCapsIndexFromDB();
    }
    return smallCapsIndex;
}

const syncSmallCapsIndexIntoDB = async (smallCapsIndex) => {
    console.log("Syncing SMLL Index into DB...");
    const db = await loadDB();
    const col = await db.collection('smll_index');
    const syncSmallCaps = smallCapsIndex.map(async stock => {
        const doSync = await col.replaceOne({ codigo: stock.codigo }, stock, { upsert: true });
        if (doSync.upsertedId) console.log(`${stock.codigo}: New stock entry created.`);
    });
    await Promise.all(syncSmallCaps);
    return true;
}

const getStockPricesAndUpdate = async (stocksMissingPrice) => {
    let stocksPrices = [];
    const beforeOperationList = [...stocksMissingPrice];
    const callAPIForResults = beforeOperationList.slice(0, 5).map(async stockCode => {
        try {
            const result = await alphaVantageAPI(timeRange.weekly, stockCode);
            if (Object.entries(result.data).length != 0) {
                removeItemFromList(result.papel, stocksMissingPrice);
                stocksPrices.push(result);
            }
        }
        catch (err) {
            console.debug(err.message);
        }
    });
    await Promise.all(callAPIForResults);
    return stocksPrices;
}

const syncStockPricesIntoDB = async (stocksPrices) => {
    const db = await loadDB();
    const col = await db.collection('smll_cotacoes');
    await col.createIndex({ papel: 1 }, { unique: true });
    await Promise.all(stocksPrices.map(async stock => {
        const doSync = await col.replaceOne({ papel: stock.papel }, stock, { upsert: true });
        if (doSync.upsertedId)
            console.log(`${stock.papel}: Created.`);
        else
            console.log(`${stock.papel}: Updated.`);
    }))
}

const removeItemFromList = (item, list) => list.splice(list.indexOf(item), 1);

const doSyncSmallCapsIntoDB = async () => {
    const smallCapsIndex = await getSmallCapsIndexAndSync();
    let stocksMissingPrice = [...smallCapsIndex].map(e => e.codigo + '.SA');
    console.log('Getting stock prices and syncing into DB.');
    while (stocksMissingPrice.length != 0) {
        const stocksPrices = await getStockPricesAndUpdate(stocksMissingPrice);
        await syncStockPricesIntoDB(stocksPrices);
        console.log(`${stocksMissingPrice.length}/${smallCapsIndex.length} stocks to go.`);
        console.log(`Trying again in 30 seconds...`);
        console.log('One more time. 🎵');
        await sleep(31000);
    }
    console.log('Synced.');
    return true;
}

module.exports = doSyncSmallCapsIntoDB;