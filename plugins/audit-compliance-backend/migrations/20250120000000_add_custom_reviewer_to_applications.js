/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function up(knex) {
  // Add custom_reviewer column to applications table
  await knex.schema.alterTable('applications', table => {
    table.string('custom_reviewer').nullable();
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function down(knex) {
  // Remove custom_reviewer column from applications table
  await knex.schema.alterTable('applications', table => {
    table.dropColumn('custom_reviewer');
  });
};
