import type { Knex } from 'knex';

const CHAT_SESSIONS_TABLE_NAME = 'chatthreads';

export async function up(knex: Knex): Promise<void> {
  if (!await knex.schema.hasTable(CHAT_SESSIONS_TABLE_NAME)) {
    await knex.schema.createTable(CHAT_SESSIONS_TABLE_NAME, table => {
      table
        .string('id')
        .primary()
        .notNullable()
        .comment('Thread id of a chat');
      table
        .string('userRef')
        .notNullable()
        .comment('userEntityRef of the User');
      table
        .jsonb('messages')
        .defaultTo([])
        .nullable()
        .comment('Messages in the thread');
      table.timestamps({
        defaultToNow: true,
        useCamelCase: true,
        useTimestamps: true,
      });
      table.index(['id', 'userRef'], 'userThreads', {
        indexType: 'FULLTEXT',
      });
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  if (await knex.schema.hasTable(CHAT_SESSIONS_TABLE_NAME)) {
    await knex.schema.dropTableIfExists(CHAT_SESSIONS_TABLE_NAME);
  }
}
