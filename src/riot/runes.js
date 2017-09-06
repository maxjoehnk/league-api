const fetch = require('node-fetch');
const d = require('debug')('league-api:riot:runes');
const cache = require('./cache')('riotRunes');

const runesFromApi = async apiKey => {
    d('Fetching all Runes from Riot Api');
    const res = await fetch(`https://euw1.api.riotgames.com/lol/static-data/v3/runes?api_key=${apiKey}`);
    const body = await res.json();
    if (!res.ok) {
        d('Response not ok', body, res.headers);
        throw new Error(body.status.message);
    }
    const runes = Object.getOwnPropertyNames(body.data).map(name => body.data[name]);
    d(`Received ${runes.length} Runes`);
    return runes.map(({ id, name, description }) => ({
        id,
        name,
        description
    }));
};

const runesFromCache = async db => {
    d('Fetching all Runes from Cache');
    const runes = await db.select().from('runes');
    d(`Got ${runes.length} Runes`);
    return runes.map(({ name, riotId, description }) => ({
        name,
        id: riotId,
        description
    }));
};

const cacheRunes = async(db, runes) => {
    d('Dropping Runes Cache');
    await db.table('runes').del();
    d('Caching Runes');
    await db.insert(runes.map(({ name, id, description }) => ({
        name,
        riotId: id,
        description
    }))).into('runes');
    d('Updating Cache Control');
    await cache.update(db);
};

const all = cache.fetch(runesFromCache, runesFromApi, cacheRunes);

module.exports = {
    all
};
