/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function up(knex) {
  await knex.schema.alterTable('application_audits', table => {
    table.string('epic_key', 50).nullable(); // JIRA epic key (e.g., JIRA-1-123)
    table.string('epic_title', 255).nullable(); // Epic title/name
    table.timestamp('epic_created_at').nullable(); // When epic was created
    table.string('epic_created_by', 255).nullable(); // Who created the epic
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function down(knex) {
  await knex.schema.alterTable('application_audits', table => {
    table.dropColumn('epic_key');
    table.dropColumn('epic_title');
    table.dropColumn('epic_created_at');
    table.dropColumn('epic_created_by');
  });
};
