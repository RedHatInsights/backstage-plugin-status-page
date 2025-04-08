/* eslint-disable func-names */
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
    return await knex.schema.createTable('akamai_access', table => {
        table.string('log_id').notNullable().comment('Single permanent Id');
        table.jsonb('search_data').notNullable().comment('Log-Stream Data!');
        table.timestamp('last_updated_on').notNullable().comment("Last search date & time");
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
    return await knex.schema.dropTable('akamai_access');
};
