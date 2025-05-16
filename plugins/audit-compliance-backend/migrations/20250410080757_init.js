/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function up(knex) {
  // Create applications table
  await knex.schema.createTable('applications', table => {
    table.increments('id').primary();
    table.string('app_name').notNullable();
    table.string('cmdb_id');
    table.string('environment');
    table.string('app_owner');
    table.string('app_delegate');
    table.string('account_name');
    table.string('source');
    table.string('type');
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  // Create application_audits table
  await knex.schema.createTable('application_audits', table => {
    table.increments('id').primary();
    table.string('app_name').notNullable(); // App name as string
    table.string('frequency').notNullable(); // 'quarterly' or 'yearly'
    table.string('period').notNullable(); // 'Q1', 'Q2', '2025', etc.
    table.string('status').notNullable().defaultTo('in_progress');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('service_account_access_review', table => {
    table.increments('id').primary();
    table.string('app_name').notNullable();
    table.string('environment').notNullable();
    table.string('service_account').notNullable();
    table.string('user_role').notNullable();
    table.string('manager').notNullable();
    table.enum('signed_off').defaultTo('Pending');
    table.string('signed_off_by').notNullable();
    table.date('sign_off_date').nullable();
    table.text('comments').nullable();
    table.string('ticket_reference');
    table.date('revoked_date');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.string('period');
    table.string('frequency');
    table.string('app_delegate');
    table.string('ticket_status');
  });

  // Rover database
  await knex.schema.createTable('group_access_reports', table => {
    table.increments('id').primary();
    table.string('environment').notNullable();
    table.string('full_name').notNullable();
    table.string('user_id').notNullable();
    table.string('user_role').notNullable();
    table.string('manager').nullable();
    table.string('sign_off_status').defaultTo('Pending');
    table.string('sign_off_by').defaultTo('N/A');
    table.date('sign_off_date').nullable();
    table.string('source').defaultTo('Rover');
    table.text('comments').nullable();
    table.string('ticket_reference').nullable();
    table.date('access_change_date').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.string('rover_group_name').notNullable();
    table.string('app_name').notNullable();
    table.string('frequency').notNullable();
    table.string('period').notNullable();
    table.string('app_delegate').nullable();
    table.string('ticket_status').nullable();
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists('application_audits');
  await knex.schema.dropTableIfExists('access_reviews');
  await knex.schema.dropTableIfExists('applications');
  await knex.schema.dropTableIfExists('service_account_access_review');
  await knex.schema.dropTableIfExists('group_access_reports');
};
