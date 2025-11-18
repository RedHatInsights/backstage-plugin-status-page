/* eslint-disable func-names */
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.alterTable('datasource', table => {
    table.text('cmdbAppCode').nullable();
    table
      .text('tags')
      .comment('Entity tags in string format')
      .nullable()
      .defaultTo('[]');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.alterTable('datasource', table => {
    table.dropColumn('cmdbAppCode');
    table.dropColumn('tags');
  });
};
