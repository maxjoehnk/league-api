const fetch = require('node-fetch');
const d = require('debug')('league-api:riot:runes');

const runes = async(db, apiKey) => {
    if (await isCacheValid(db)) {
        return await runesFromCache(db);
    }else {
        const runes = await runesFromApi(apiKey);
        await cacheRunes(db, runes);
        return runes;
    }
};

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

const isCacheValid = async db => {
    d('Checking Cache');
    const res = await db.select('expires')
        .where('cacheIdentifier', 'riotRunes')
        .from('cacheControl');
    return res.length > 0 && res[0].expires > Date.now();
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
    await db.from('cacheControl')
        .where('cacheIdentifier', 'riotRunes')
        .del();
    await db.insert({
        cacheIdentifier: 'riotRunes',
        lastModified: new Date(),
        expires: new Date(Date.now() + (1000 * 60 * 60 * 24 * 2)) // Expire in two days
    }).into('cacheControl');
};

module.exports = {
    runes
};
