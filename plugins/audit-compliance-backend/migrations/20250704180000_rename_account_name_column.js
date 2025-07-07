/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function up(knex) {
  if (await knex.schema.hasColumn('group_access_reports', 'rover_group_name')) {
    await knex.schema.alterTable('group_access_reports', table => {
      table.renameColumn('rover_group_name', 'account_name');
    });
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function down(knex) {
  await knex.schema.alterTable('group_access_reports', table => {
    table.renameColumn('account_name', 'rover_group_name');
  });
};
