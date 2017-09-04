exports.up = async function(knex) {
    await knex.schema.table('championSpells', table => {
        table.string('key');
        table.string('tooltip');
        table.string('cooldown');
        table.string('cost');
        table.string('range');
    });
};

exports.down = async function(knex) {
    await knex.schema.table('championSpells', table => {
        table.dropColumn('tooltip');
        table.dropColumn('key');
        table.dropColumn('cooldown');
        table.dropColumn('cost');
        table.dropColumn('range');
    });
};
