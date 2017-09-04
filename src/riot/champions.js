const fetch = require('node-fetch');
const Fuse = require('fuse.js');
const d = require('debug')('league-api:riot:champions');

const all = async(db, apiKey) => {
    if (await isCacheValid(db)) {
        return await championsFromCache(db);
    }else {
        const champions = await championsFromApi(apiKey);
        await cacheChampions(db, champions);
        return champions;
    }
};

const find = async(db, apiKey, search, threshold = 0.2) => {
    const champions = await all(db, apiKey);
    const finder = new Fuse(champions, {
        shouldSort: true,
        threshold,
        keys: [
            'name'
        ]
    });
    const result = finder.search(search);
    d(`Query ${search} returned ${result.length} results`);
    if (result.length > 0) {
        return result[0];
    }
    throw new Error('Unknown Champion');
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
        key: champion.key,
        name: champion.name,
        title: champion.title,
        lore: champion.lore,
        loreExcerpt: champion.blurb,
        imageUrl: imageBuilder(champion.image),
        skills: [spellBuilder(champion.passive), ...champion.spells.map(spellBuilder)],
        infoDifficulty: champion.info.difficulty,
        infoAttack: champion.info.attack,
        infoDefense: champion.info.defense,
        infoMagic: champion.info.magic,
        healthBase: champion.stats.hp,
        healthPerLevel: champion.stats.hpperlevel,
        healthRegenBase: champion.stats.hpregen,
        healthRegenPerLevel: champion.stats.hpregenperlevel,
        adBase: champion.stats.attackdamage,
        adPerLevel: champion.stats.attackdamageperlevel,
        asBase: 0,
        asPerLevel: champion.stats.attackspeedperlevel,
        armorBase: champion.stats.armor,
        armorPerLevel: champion.stats.armorperlevel,
        mrBase: champion.stats.spellblock,
        mrPerLevel: champion.stats.spellblockperlevel,
        movespeed: champion.stats.movespeed
    };
};

const cacheChampionToModel = spells => champion =>
    Object.assign({}, champion, {
        id: champion.riotId,
        key: champion.riotKey,
        skills: spells
            .filter(({ championId }) => championId === champion.riotId)
            .map(skill => ({
                name: skill.name,
                description: skill.description,
                imageUrl: skill.imageUrl
            }))
    });

const modelToCacheChampion = ({
    id,
    key,
    name,
    title,
    lore,
    loreExcerpt,
    imageUrl,
    infoDifficulty,
    infoAttack,
    infoDefense,
    infoMagic,
    healthBase,
    healthPerLevel,
    healthRegenBase,
    healthRegenPerLevel,
    adBase,
    adPerLevel,
    asBase,
    asPerLevel,
    armorBase,
    armorPerLevel,
    mrBase,
    mrPerLevel,
    movespeed
}) => ({
    riotId: id,
    riotKey: key,
    name,
    title,
    lore,
    loreExcerpt,
    imageUrl,
    infoDifficulty,
    infoAttack,
    infoDefense,
    infoMagic,
    healthBase,
    healthPerLevel,
    healthRegenBase,
    healthRegenPerLevel,
    adBase,
    adPerLevel,
    asBase,
    asPerLevel,
    armorBase,
    armorPerLevel,
    mrBase,
    mrPerLevel,
    movespeed
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
    const res = await db.select()
        .where('cacheIdentifier', 'riotChampions')
        .from('cacheControl');
    return res.length > 0 && res[0].expires > Date.now();
};

const cacheChampions = async(db, champions) => {
    await db.transaction(async knex => {
        d('Dropping Champions Cache');
        await knex.table('champions').del();
        await knex.table('championSpells').del();
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
    all,
    find
};
