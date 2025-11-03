import { resolvePackagePath } from '@backstage/backend-plugin-api';
import { Knex } from 'knex';
import { DateTime } from 'luxon';

const migrationsDir = resolvePackagePath(
  '@compass/backstage-plugin-datasource-backend',
  'migrations',
);

export async function createDatabaseSchema(options: {
  knex: Knex;
  skipMigrations: boolean;
}) {
  const database = options.knex;

  if (!options.skipMigrations)
    await database.migrate.latest({
      directory: migrationsDir,
    });
}

export function knexNow(): string {
  return DateTime.now().toUTC().toISO();
}
