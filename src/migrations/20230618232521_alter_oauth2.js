exports.up = (knex) => knex.schema
  .alterTable('oauth2_clients', (table) => {
    table.renameColumn('client_id', 'clientId');
    table.renameColumn('redirect_uris', 'redirectUris');
  })
  .alterTable('oauth2_tokens', (table) => {
    table.renameColumn('oauth2_client_id', 'oauth2ClientId');
    table.renameColumn('user_id', 'userId');
    table.renameColumn('access_token', 'accessToken');
    table.renameColumn('access_token_ttl', 'accessTokenTtl');
    table.renameColumn('refresh_token', 'refreshToken');
    table.renameColumn('refresh_token_ttl', 'refreshTokenTtl');
  });

exports.down = (knex) => knex.schema
  .alterTable('oauth2_clients', (table) => {
    table.renameColumn('clientId', 'client_id');
    table.renameColumn('redirectUris', 'redirect_uris');
  })
  .alterTable('oauth2_tokens', (table) => {
    table.renameColumn('oauth2ClientId', 'oauth2_client_id');
    table.renameColumn('userId', 'user_id');
    table.renameColumn('accessToken', 'access_token');
    table.renameColumn('accessTokenTtl', 'access_token_ttl');
    table.renameColumn('refreshToken', 'refresh_token');
    table.renameColumn('refreshTokenTtl', 'refresh_token_ttl');
  });
