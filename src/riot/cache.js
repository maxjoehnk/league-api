const d = require('debug')('league-api:riot:cache');

const update = identifier => async db => {
    await db.table('cacheControl')
        .where('cacheIdentifier', identifier)
        .del();
    await db.insert({
        cacheIdentifier: identifier,
        lastModified: new Date(),
        expires: new Date(Date.now() + (1000 * 60 * 60 * 24 * 2)) // Expire in two days
    }).into('cacheControl');
};

const isValid = identifier => async db => {
    d(`Checking Cache for ${identifier}`);
    const res = await db.select()
        .where('cacheIdentifier', identifier)
        .from('cacheControl');
    return res.length > 0 && res[0].expires > Date.now();
};

const fetch = identifier => (fetchCache, fetchApi, storeCache) => {
    const isCacheValid = isValid(identifier);
    return async(db, apiKey) => {
        if (await isCacheValid(db)) {
            return await fetchCache(db);
        }else {
            const result = await fetchApi(apiKey);
            await storeCache(result);
            return result;
        }
    };
};

module.exports = identifier => ({
    update: update(identifier),
    isValid: isValid(identifier),
    fetch: fetch(identifier)
});
