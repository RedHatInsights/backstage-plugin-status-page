/* eslint-disable func-names */
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable('datasource', table => {
    table.uuid('id').primary().notNullable();
    table.text('name').comment('Name of datasource');
    table.text('title').comment('Title of datasource');
    table.text('namespace');
    table.text('description').comment('What does the data contains');
    table.text('type').comment('Type of datastore');
    table.text('owner').comment('data owner');
    table.text('steward').comment('Data steward');
    table.text('usage').comment('How the data is used');
    table.text('location').comment('Where is data stored');
    table.text('existsIn').comment('JSON format, where data exists');
    table.text('system').comment('which project is this used by');
    table.text('dependencyOf').comment('Componnets that use this datasource');
    table
      .text('dependsOn')
      .comment('Any library this datasource is dependednt on');
    table
      .enum('aiRelated', ['true', 'false'])
      .comment('is the datasource ai related');
    table
      .enum('classification', [
        'RH-Public',
        'RH-Internal',
        'RH-Restricted',
        'RH-Restricted(+PII)',
      ])
      .comment('Data classification');
    table.text('createdBy');
    table.text('updatedBy');
    table.timestamps(true, true, true);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTable('datasource');
};
