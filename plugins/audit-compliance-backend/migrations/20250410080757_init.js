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
    table.string('app_owner_email');
    table.string('app_delegate');
    table.string('account_name');
    table.string('source');
    table.string('type');
    table.string('jira_project');
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  // Create application_audits table
  await knex.schema.createTable('application_audits', table => {
    table.increments('id').primary();
    table.string('app_name').notNullable(); // App name as string
    table.string('frequency').notNullable(); // 'quarterly' or 'yearly'
    table.string('period').notNullable(); // 'Q1-2025'.
    table.string('status').notNullable().defaultTo('in_progress');
    table
      .enum('progress', [
        'audit_started',
        'details_under_review',
        'final_sign_off_done',
        'summary_generated',
        'completed',
      ])
      .notNullable()
      .defaultTo('audit_started');
    table.string('jira_key').nullable(); // Store the Jira ticket key
    table.string('jira_status').nullable(); // Store the Jira ticket status
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.string('completed_by').nullable();
    table.timestamp('completed_at').nullable();
    // Add unique constraint for app_name, frequency, and period
    table.unique(['app_name', 'frequency', 'period']);
  });

  await knex.schema.createTable('service_account_access_review', table => {
    table.increments('id').primary();
    table.string('app_name').notNullable();
    table.string('environment').notNullable();
    table.string('service_account').notNullable();
    table.string('user_role').notNullable();
    table.string('manager').notNullable();
    table.string('manager_uid').nullable();
    table.string('sign_off_by').defaultTo('N/A');
    table.string('sign_off_status').defaultTo('pending');
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
    table.string('source').nullable();
  });

  // Rover database
  // Rover database
  await knex.schema.createTable('group_access_reports', table => {
    table.increments('id').primary();
    table.string('environment').notNullable();
    table.string('full_name').notNullable();
    table.string('user_id').notNullable();
    table.string('user_role').notNullable();
    table.string('manager').nullable();
    table.string('manager_uid').nullable();
    table.string('sign_off_status').defaultTo('pending');
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

  // Create service_account_access_review_fresh table for storing raw data from sources
  await knex.schema.createTable(
    'service_account_access_review_fresh',
    table => {
      table.increments('id').primary();
      table.string('app_name').notNullable();
      table.string('environment').notNullable();
      table.string('service_account').notNullable();
      table.string('user_role').notNullable();
      table.string('manager').notNullable();
      table.string('app_delegate');
      table.string('source').notNullable(); // 'Rover' or 'Git'
      table.string('account_name');
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.string('period');
      table.string('frequency');
      // Update unique constraint to use app_name, frequency, and period
      table.unique(['app_name', 'frequency', 'period']);
    },
  );

  // Create group_access_reports_fresh table for storing raw data from sources
  await knex.schema.createTable('group_access_reports_fresh', table => {
    table.increments('id').primary();
    table.string('environment').notNullable();
    table.string('full_name').notNullable();
    table.string('user_id').notNullable();
    table.string('user_role').notNullable();
    table.string('manager').nullable();
    table.string('source').notNullable(); // 'Rover' or 'Git'
    table.string('account_name').notNullable();
    table.string('app_name').notNullable();
    table.string('frequency').notNullable();
    table.string('period').notNullable();
    table.string('app_delegate').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    // Update unique constraint to use app_name, frequency, and period
    table.unique(['app_name', 'frequency', 'period']);
  });

  // Create audit_metadata table for storing documentation, evidence, and auditor notes
  await knex.schema.createTable('audit_metadata', table => {
    table.increments('id').primary();
    table.integer('audit_id').unsigned().notNullable();
    table.jsonb('documentation_evidence').nullable();
    table.jsonb('auditor_notes').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    // Add foreign key constraint
    table
      .foreign('audit_id')
      .references('id')
      .inTable('application_audits')
      .onDelete('CASCADE');

    // Add unique constraint to ensure one metadata record per audit
    table.unique(['audit_id']);
  });

  // Create activity_stream table for storing audit activity events
  return knex.schema.createTable('activity_stream', table => {
    table.increments('id').primary();
    table.string('account_name', 255);
    table.string('app_name', 255).notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.string('event_type', 100);
    table.string('frequency', 50);
    table.string('new_status', 100);
    table.string('performed_by', 255);
    table.string('period', 50);
    table.string('previous_status', 100);
    table.text('reason');
    table.string('source', 100);
    table.string('user_id', 255);
    table.jsonb('metadata').nullable();

    // Indexes
    table.index('app_name');
    table.index('created_at');
    table.index('event_type');
    table.index('user_id');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function down(knex) {
  await knex.schema.dropTable('audit_metadata');
  await knex.schema.dropTable('service_account_access_review_fresh');
  await knex.schema.dropTable('group_access_reports_fresh');
  await knex.schema.dropTable('service_account_access_review');
  await knex.schema.dropTable('application_audits');
  await knex.schema.dropTable('applications');
  await knex.schema.dropTable('group_access_reports');
  await knex.schema.dropTable('activity_stream');
};
