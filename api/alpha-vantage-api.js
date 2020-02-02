const axios = require('axios');

const timeRange = {
    intraDay: 'TIME_SERIES_INTRADAY',
    daily: 'TIME_SERIES_DAILY',
    weekly: 'TIME_SERIES_WEEKLY',
    monthly: 'TIME_SERIES_MONTHLY'
}

const outputCompact = 'compact'
const outputFull = 'full'

const apikey = process.env.ALPHAVANTAGE_APIKEY;
const baseURL = process.env.ALPHAVANTAGE_URL;

const createParams = (timeRange, symbol) => {
    return {
        apikey: apikey,
        outputsize: outputCompact,
        function: timeRange,
        symbol: symbol
    }
}

const createRequest = (timeRange, symbol) => {
    return {
        baseURL: baseURL,
        timeout: 10000,
        params: createParams(timeRange, symbol)
    }
}

const alphaVantageAPI = async (timeRange, symbol) => {
    let data;
    await axios.get('/query', createRequest(timeRange, symbol))
        .then((response) => {
            data = {
                papel: symbol,
                data: formata(response)
            }
        });
    return data;
}

const formata = (response) => {
    let data = response.data;
    let properties = Object.getOwnPropertyNames(data);
    let metaDataProperty = properties[0];
    let seriesProperty = properties[1];

    if (data.Note) {
        return {};
    }

    if (data['Error Message']) {
        throw new Error('API problem.')
    }

    let dateProperties = Object.getOwnPropertyNames(data[seriesProperty]);
    dateProperties.sort((a, b) => new Date(b) - new Date(a))

    data = dateProperties.map((date) => (
        {
            date: date,
            info: data[seriesProperty][date]
        }
    ));

    let currentInformation = Object.getOwnPropertyNames(data[0].info);
    let newInformation = currentInformation.map((info) => info.split(" ").pop());

    data.forEach(item => {
        currentInformation.forEach((currentInfo, i) => {
            item.info[newInformation[i]] = item.info[currentInfo];
            delete item.info[currentInfo]
        });
    });

    return data;
}

exports.alphaVantageAPI = alphaVantageAPI;
exports.timeRange = timeRange;
