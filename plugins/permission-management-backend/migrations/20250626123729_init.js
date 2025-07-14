/* eslint-disable func-names */
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  return await knex.schema.createTable('access_requests', table => {
    table.text('id').primary().notNullable().comment('Unique ID for the access request');
    table.text('userName').notNullable().comment('Name of requester');
    table.text('userEmail').notNullable().comment('Email of requester');
    table.text('userId').notNullable().comment('Unique user identifier');
    table.text('timestamp').notNullable().comment('Timestamp when request was made');
    table.text('status').notNullable().comment('Status of request (e.g., approved, rejected)');
    table.text('group').notNullable().comment('Group or team being requested access to');
    table.text('role').notNullable().comment('Role requested (e.g., member, owner)');
    table.text('reason').notNullable().comment('Reason for requesting access');
    table.text('reviewer').comment('Reviewer name or ID');
    table.text('rejectionReason').comment('Optional reason for rejection');
    table.text('createdBy').notNullable().comment('User who created the record');
    table.text('updatedBy').notNullable().comment('User who last updated the record');
    table.text('createdAt').notNullable().comment('Timestamp of creation');
    table.text('updatedAt').notNullable().comment('Timestamp of last update');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  return await knex.schema.dropTable('access_requests');
};
