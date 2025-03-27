/* eslint-disable func-names */
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
    return await knex.schema.createTable('datalayer', table => {
        table.text('subgraph').unique().notNullable().comment('Name of the subgraph');
        table.jsonb('search_data').comment('Splunk query search data');
        table.timestamp('last_updated_on').notNullable().comment("Last search date & time");
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
    return await knex.schema.dropTable('datalayer');
};
