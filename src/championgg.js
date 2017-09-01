const fetch = require('node-fetch');
const d = require('debug')('league-api:champion.gg');

const champion = async(key, id) => {
    d(`Fetching Stats for ${id}`);
    const url = `http://api.champion.gg/v2/champions/${id}?champData=hashes&api_key=${key}`;
    const res = await fetch(url);
    const body = await res.json();
    if (!res.ok) {
        d('Error Body', body);
        throw new Error('Invalid Response');
    }
    const [result] = body;
    return result;
};

module.exports = {
    champion
};
