/* eslint-disable func-names */
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  if (!(await knex.schema.hasTable('arts')))
    await knex.schema.createTable('arts', builder => {
      builder
        .text('id')
        .notNullable()
        .primary()
        .comment('UUID v4 id for each ART');
      builder.text('name').notNullable().comment('Slug of the ART');
      builder.text('title').notNullable().comment('Title of ART');
      builder.text('description');
      builder
        .text('workstreams')
        .comment('List of workstream in ART')
        .notNullable();
      builder.text('members').notNullable();
      builder.text('pillar').notNullable();
      builder.text('rte').nullable();
      builder.text('jira_project').nullable();
      builder.text('links').nullable();
      builder.text('created_by').notNullable();
      builder.text('updated_by').notNullable();
      builder.timestamps(true, true);
    });
  if (!(await knex.schema.hasTable('user_notes')))
    await knex.schema.createTable('user_notes', builder => {
      builder.text('user_ref').primary();
      builder.text('note').nullable();
      builder.text('modification_history').nullable();
    });

  await knex.schema.alterTable('workstreams', builder => {
    builder.text('updated_by').nullable();
    builder.text('art').nullable();
  });

  return;
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('arts');
  await knex.schema.dropTableIfExists('user_notes');
  await knex.schema.alterTable('workstreams', builder => {
    builder.dropColumn('updated_by');
    builder.dropColumn('art');
  });
  return;
};
