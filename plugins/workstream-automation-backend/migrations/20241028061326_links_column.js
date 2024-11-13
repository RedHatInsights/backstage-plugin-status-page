/* eslint-disable func-names */
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.alterTable('workstreams', table => {
    table.text('links').nullable().defaultTo('[]');
  });

  const results = await knex('workstreams')
    .select('email')
    .select('name')
    .select('slack_channel_url');
  results.forEach(async result => {
    await knex('workstreams')
      .where('name', result.name)
      .update(
        'links',
        JSON.stringify([
          ...(result.email
            ? [
                {
                  url: `mailto://${result.email}`,
                  title: 'Email',
                  icon: 'mail',
                  type: 'Contact',
                },
              ]
            : []),
          ...(result.slack_channel_url
            ? [
                {
                  url: result.slack_channel_url,
                  title: 'Slack',
                  icon: 'slack_contact',
                  type: 'Contact',
                },
              ]
            : []),
        ]),
      );
  });
  await knex.schema.alterTable('workstreams', table => {
    table.dropColumn('email');
    table.dropColumn('slack_channel_url');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.alterTable('workstreams', table => {
    table.dropColumn('links');
    table.text('email').nullable();
    table.text('slack_channel_url').nullable();
  });
};
