exports.up = async function(knex) {
    await knex.schema.table('champions', table => {
        table.string('title');
        table.text('lore');
    });
    await knex.schema.createTable('championSpells', table => {
        table.increments();
        table.integer('championId');
        table.foreign('championId').references('champions.riotId');
        table.string('name');
        table.string('description');
        table.string('imageUrl');
    });
    await knex.from('cacheControl')
        .where('cacheIdentifier', 'riotChampions')
        .del();
};

exports.down = async function(knex) {
    await knex.schema.table('champions', table => {
        table.dropColumn('title');
        table.dropColumn('lore');
    });
    await knex.schema.dropTable('championSpells');
};
