const fetch = require('node-fetch');
const d = require('debug')('league-api:riot:items');
const cache = require('./cache')('riotItems');

const itemsFromApi = async apiKey => {
    d('Fetching all Items from Riot Api');
    const res = await fetch(`https://euw1.api.riotgames.com/lol/static-data/v3/items?tags=all&api_key=${apiKey}`);
    const body = await res.json();
    if (!res.ok) {
        d('Response not ok', body, res.headers);
        throw new Error(body.status.message);
    }
    const items = Object.getOwnPropertyNames(body.data).map(name => body.data[name]);
    d(`Received ${items.length} Items`);
    const imageBase = `http://ddragon.leagueoflegends.com/cdn/${body.version}/img`;
    return items.map(({ id, name, sanitizedDescription, image }) => ({
        id,
        name,
        description: sanitizedDescription,
        imageUrl: `${imageBase}/${image.group}/${image.full}`
    }));
};

const itemsFromCache = async db => {
    d('Fetching all Items from Cache');
    const items = await db.select().from('items');
    d(`Got ${items.length} Items`);
    return items.map(({ name, riotId, description, imageUrl }) => ({
        name,
        id: riotId,
        description,
        imageUrl
    }));
};

const cacheItems = async(db, items) => {
    d('Dropping Items Cache');
    await db.table('items').del();
    d('Caching Items');
    await Promise.all(items.map(({ name, id, description, imageUrl }) => ({
        name,
        riotId: id,
        description,
        imageUrl
    })).map(item => db.insert(item).into('items')));
    d('Updating Cache Control');
    await cache.update(db);
};

const all = cache.fetch(itemsFromCache, itemsFromApi, cacheItems);

module.exports = {
    all
};
