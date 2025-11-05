/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function up(knex) {
  await knex.schema.createTable('system_audit', table => {
    table.increments('id').primary();
    table.string('app_name').nullable();
    table.string('application_owner').nullable();
    table.string('cmdb_app_id').nullable();
    table.string('ldap_common_name').notNullable();
    table.string('rover_link').nullable();
    table.string('responsible_party').nullable();
    table.text('directly_used_by').nullable(); // JSON array stored as text
    table.boolean('still_required').defaultTo(true);
    table.boolean('audit_cleanup_completed').defaultTo(false);
    table.text('usage_notes').nullable();
    table.date('review_date').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists('system_audit');
};
