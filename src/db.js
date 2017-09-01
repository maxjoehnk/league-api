const knex = require('knex');
const { join } = require('path');
const d = require('debug')('league-api:db');

const connect = () => {
    d('Opening Database');
    return knex({
        client: 'sqlite3',
        connection: {
            filename: './cache.sqlite'
        },
        useNullAsDefault: true
    });
};

const migrate = async db => {
    d('Migrating Database');
    await db.migrate.latest({
        directory: join(__dirname, '../migrations')
    });
};

module.exports = {
    connect,
    migrate
};
