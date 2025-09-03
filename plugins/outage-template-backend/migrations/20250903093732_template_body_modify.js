/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function up(knex) {
    if (await knex.schema.hasColumn('templates', 'body')) {
      await knex.schema.alterTable('templates', table => {
        table.specificType('body', 'text').alter();
      });
    }
  };
  
  /**
   * @param { import("knex").Knex } knex
   * @returns { Promise<void> }
   */
  exports.down = async function down(knex) {
    await knex.schema.alterTable('templates', table => {    
      table.specificType('body', 'jsonb').alter();
    });
  };
