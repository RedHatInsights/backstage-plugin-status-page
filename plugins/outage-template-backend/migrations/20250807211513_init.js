/* eslint-disable func-names */
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
    return await knex.schema.createTable('templates', table => {
        table.text('id').unique().primary().notNullable().comment('Id of the template');
        table.text('name').unique().notNullable().comment('Name of the incident template');
        table.jsonb('body').comment('Template body');
        table.text('impactOverride').comment('Impact of the incident');
        table.text('status').comment('Status of the incident');
        table.text('created_on').comment('Created on');
        table.timestamp('last_updated_on').notNullable().comment("Last update date & time");
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
    return await knex.schema.dropTable('templates');
};