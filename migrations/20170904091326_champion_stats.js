exports.up = async function(knex) {
    await knex.schema.table('champions', table => {
        table.string('riotKey');
        table.text('loreExcerpt');
        table.integer('infoDifficulty');
        table.integer('infoAttack');
        table.integer('infoDefense');
        table.integer('infoMagic');
        table.float('healthBase');
        table.float('healthPerLevel');
        table.float('healthRegenBase');
        table.float('healthRegenPerLevel');
        table.float('adBase');
        table.float('adPerLevel');
        table.float('asBase');
        table.float('asPerLevel');
        table.float('armorBase');
        table.float('armorPerLevel');
        table.float('mrBase');
        table.float('mrPerLevel');
        table.float('movespeed');
    });
};

exports.down = async function(knex) {
    await knex.schema.table('champions', table => {
        table.dropColumn('loreExcerpt');
        table.dropColumn('infoDifficulty');
        table.dropColumn('infoAttack');
        table.dropColumn('infoDefense');
        table.dropColumn('infoMagic');
        table.dropColumn('healthBase');
        table.dropColumn('healthPerLevel');
        table.dropColumn('healthRegenBase');
        table.dropColumn('healthRegenPerLevel');
        table.dropColumn('adBase');
        table.dropColumn('adPerLevel');
        table.dropColumn('asBase');
        table.dropColumn('asPerLevel');
        table.dropColumn('armorBase');
        table.dropColumn('armorPerLevel');
        table.dropColumn('mrBase');
        table.dropColumn('mrPerLevel');
        table.dropColumn('movespeedBase');
    });
};
