/* eslint-disable func-names */
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  return await knex.schema.alterTable('workstreams', table => {
    table.text('lead').nullable().alter();
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex('workstreams')
    .whereNull('lead')
    .update({ lead: 'user:redhat/yoswal' });
  return await knex.schema.alterTable('workstreams', table => {
    table.text('lead').notNullable().alter();
  });
};
