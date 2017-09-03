const fetch = require('node-fetch');
const d = require('debug')('league-api:champion.gg');

const roleFilter = {
    top: 'TOP',
    jungle: 'JUNGLE',
    mid: 'MIDDLE',
    adc: 'DUO_CARRY',
    support: 'DUO_SUPPORT'
};

const allRoles = async(key, id) => {
    d(`Fetching Stats for ${id}`);
    const url = `http://api.champion.gg/v2/champions/${id}?champData=hashes&api_key=${key}`;
    const res = await fetch(url);
    const body = await res.json();
    if (!res.ok) {
        d('Error Body', body);
        throw new Error('Invalid Response');
    }
    if (body.length === 0) {
        throw new Error('Invalid Champion');
    }
    return body;
};

const mostPlayed = async(key, id) => {
    const roles = await allRoles(key, id);
    return roles.sort((a, b) => a.playRate - b.playRate)[0];
};

const byRole = async(key, id, role) => {
    const roles = await allRoles(key, id);
    const result = roles.find(champion => champion.role === roleFilter[role]);
    if (!result) {
        throw new Error('Invalid Role');
    }
    return result;
};

const getLabelForRole = role => {
    switch (role) {
        case 'TOP':
            return 'Top';
        case 'JUNGLE':
            return 'Jungle';
        case 'MIDDLE':
            return 'Mid';
        case 'DUO_CARRY':
            return 'ADC';
        case 'DUO_SUPPORT':
            return 'Support';
    }
}

module.exports = {
    allRoles,
    byRole,
    mostPlayed,
    getLabelForRole,
    roleFilter
};
