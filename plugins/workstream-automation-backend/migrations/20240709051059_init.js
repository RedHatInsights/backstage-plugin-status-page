/* eslint-disable func-names */
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  return await knex.schema.createTable('workstreams', table => {
    table.text('name').unique().notNullable().comment('Name of the workstream');
    table.text('title').notNullable().comment('Title of workstream');
    table.text('portfolio').comment('Portfolio of workstream').notNullable();
    table.text('members').notNullable();
    table.text('description');
    table.text('pillar').notNullable();
    table.text('lead').notNullable();
    table.text('jira_project').notNullable();
    table.timestamps(true, true);
    table.text('created_by').notNullable();
    table.text('slack_channel_url');
    table.text('email').notNullable();
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  return await knex.schema.dropTable('workstreams');
};
