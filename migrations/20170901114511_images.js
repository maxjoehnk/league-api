exports.up = async function(knex) {
    await knex.schema.table('champions', table => {
        table.string('imageUrl');
    });
    await knex.schema.table('items', table => {
        table.string('imageUrl');
    });
};

exports.down = async function(knex) {
    await knex.schema.table('champions', table => {
        table.dropColumn('imageUrl');
    });
    await knex.schema.table('items', table => {
        table.dropColumn('imageUrl');
    });
};
