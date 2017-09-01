const fetch = require('node-fetch');
const d = require('debug')('league-api:riot:champions');

const champions = async(db, apiKey) => {
    if (await isCacheValid(db)) {
        return await championsFromCache(db);
    }else {
        const champions = await championsFromApi(apiKey);
        await cacheChampions(db, champions);
        return champions;
    }
};

const apiToImageUrl = version => image =>
    `http://ddragon.leagueoflegends.com/cdn/${version}/img/${image.group}/${image.full}`;


const apiSpellToModel = imageBuilder => spell => ({
    name: spell.name,
    description: spell.sanitizedDescription,
    imageUrl: imageBuilder(spell.image)
});

const apiChampionToModel = body => champion => {
    const imageBuilder = apiToImageUrl(body.version);
    const spellBuilder = apiSpellToModel(imageBuilder);
    return {
        id: champion.id,
        name: champion.name,
        title: champion.title,
        lore: champion.lore,
        imageUrl: imageBuilder(champion.image),
        skills: champion.spells.map(spellBuilder)
    };
};

const cacheChampionToModel = spells => champion => ({
    id: champion.riotId,
    name: champion.name,
    title: champion.title,
    lore: champion.lore,
    imageUrl: champion.imageUrl,
    skills: spells
        .filter(({ championId }) => championId === champion.riotId)
        .map(skill => ({
            name: skill.name,
            description: skill.description,
            imageUrl: skill.imageUrl
        }))
});

const modelToCacheChampion = model => ({
    riotId: model.id,
    name: model.name,
    title: model.title,
    lore: model.lore,
    imageUrl: model.imageUrl
});

const modelToCacheSkills = model => model.skills.map(skill => ({
    championId: model.id,
    name: skill.name,
    description: skill.description,
    imageUrl: skill.imageUrl
}));

const championsFromApi = async apiKey => {
    d('Fetching all Champions from Riot Api');
    const res = await fetch(`https://euw1.api.riotgames.com/lol/static-data/v3/champions?tags=all&api_key=${apiKey}`);
    const body = await res.json();
    if (!res.ok) {
        d('Response not ok', body, res.headers);
        throw new Error(body.status.message);
    }
    const champions = Object.getOwnPropertyNames(body.data).map(name => body.data[name]);
    d(`Received ${champions.length} Champions`);
    return champions.map(apiChampionToModel(body));
};

const championsFromCache = async db => {
    d('Fetching all Champions from Cache');
    const champions = await db.select().from('champions');
    const skills = await db.select().from('championSpells');
    d(`Got ${champions.length} Champions`);
    return champions.map(cacheChampionToModel(skills));
};

const isCacheValid = async db => {
    d('Checking Cache');
    const res = await db.select('expires')
        .where('cacheIdentifier', 'riotChampions')
        .from('cacheControl');
    return res.length > 0 && res[0].expires > Date.now();
};

const cacheChampions = async(db, champions) => {
    await db.transaction(async knex => {
        d('Dropping Champions Cache');
        await knex.table('champions').del();
        d('Caching Campions');
        const promises = champions.map(async model => {
            await knex.insert(modelToCacheChampion(model)).into('champions');
            await knex.insert(modelToCacheSkills(model)).into('championSpells');
        });
        await Promise.all(promises);
        d('Updating Cache Control');
        await knex.table('cacheControl')
            .where('cacheIdentifier', 'riotChampions')
            .del();
        await knex.insert({
            cacheIdentifier: 'riotChampions',
            lastModified: new Date(),
            expires: new Date(Date.now() + (1000 * 60 * 60 * 24 * 2)) // Expire in two days
        }).into('cacheControl');
    });
};

module.exports = {
    champions
};
