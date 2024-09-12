/* eslint-disable func-names */
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  return await knex.schema.alterTable('workstreams', table => {
    table
      .text('id')
      .comment('UUID v4 id for each workstream')
      .notNullable()
      .unique();
    table.text('jira_project').nullable().alter();
    table.text('email').nullable().alter();
    table
      .text('name')
      .comment('Slug for workstream name')
      .notNullable()
      .alter();
    table.dropUnique('name');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  return await knex.schema.alterTable('workstreams', table => {
    table.dropColumn('id');
  });
};
