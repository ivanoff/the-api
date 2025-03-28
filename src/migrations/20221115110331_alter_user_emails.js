exports.up = (knex) => knex.raw(`UPDATE users SET email = LOWER(email)`);

exports.down = () => {};
