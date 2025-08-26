/**
 * @param { import('knex').Knex } knex
 */
exports.up = async function up(knex) {
  // Create enum for role names (PostgreSQL)
  await knex.schema.createTable('app_user_roles', table => {
    table.string('app_name').notNullable();
    table.string('username').notNullable();
    table
      .enu(
        'role_name',
        ['application_user', 'app_owner', 'delegate', 'compliance_manager'],
        { useNative: true, enumName: 'audit_role' },
      )
      .notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    // audit fields
    table.text('created_by').notNullable().defaultTo('system');
    table.text('updated_by').nullable();
    table.timestamp('updated_at').nullable();

    table.primary(['app_name', 'username', 'role_name']);
    table.index(['app_name', 'username'], 'idx_app_user_roles_app_user');
  });
};

/**
 * @param { import('knex').Knex } knex
 */
exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists('app_user_roles');
  // Drop enum type if it exists (PostgreSQL only)
  try {
    await knex.raw('drop type if exists audit_role');
  } catch {
    // ignore for non-postgres
  }
};
