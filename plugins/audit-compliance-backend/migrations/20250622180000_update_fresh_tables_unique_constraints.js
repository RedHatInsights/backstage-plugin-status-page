// Migration to update unique constraints on *_fresh tables for audit-compliance

/**
 * @param { import('knex').Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function up(knex) {
  // Drop old unique constraint and add new one for group_access_reports_fresh
  await knex.schema.alterTable('group_access_reports_fresh', table => {
    table.dropUnique(['app_name', 'frequency', 'period']);
    table.unique(['app_name', 'frequency', 'period', 'full_name', 'source']);
  });

  // Drop old unique constraint and add new one for service_account_access_review_fresh
  await knex.schema.alterTable('service_account_access_review_fresh', table => {
    table.dropUnique(['app_name', 'frequency', 'period']);
    table.unique(['app_name', 'frequency', 'period', 'account_name', 'source']);
  });
};

/**
 * @param { import('knex').Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function down(knex) {
  // Revert to old unique constraints
  await knex.schema.alterTable('group_access_reports_fresh', table => {
    table.dropUnique([
      'app_name',
      'frequency',
      'period',
      'full_name',
      'source',
    ]);
    table.unique(['app_name', 'frequency', 'period']);
  });

  await knex.schema.alterTable('service_account_access_review_fresh', table => {
    table.dropUnique([
      'app_name',
      'frequency',
      'period',
      'account_name',
      'source',
    ]);
    table.unique(['app_name', 'frequency', 'period']);
  });
};
