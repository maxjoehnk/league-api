exports.up = async function(knex) {
    await knex.schema.createTable('champions', table => {
        table.increments();
        table.string('name');
        table.string('riotId');
    });
    await knex.schema.createTable('cacheControl', table => {
        table.increments();
        table.string('cacheIdentifier');
        table.dateTime('expires');
        table.dateTime('lastModified');
    });
};

exports.down = async function(knex) {
    knex.schema.dropTable('champions');
    knex.schema.dropTable('cacheControl');
};
