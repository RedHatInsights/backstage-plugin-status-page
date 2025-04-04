/* eslint-disable func-names */
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
    return await knex.schema.createTable('subgraphs', table => {
        table.string('search_id').notNullable().comment('Single permanent Id');
        table.jsonb('search_data').notNullable().comment('Subgraphs developed');
        table.timestamp('last_updated_on').notNullable().comment("Last search date & time");
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
    return await knex.schema.dropTable('subgraphs');
};
