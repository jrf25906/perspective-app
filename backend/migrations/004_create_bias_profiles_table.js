/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('bias_profiles', function (table) {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable().unique();
    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.float('political_lean').notNullable(); // -100 to 100
    table.float('openness_score').notNullable(); // 0 to 100
    table.specificType('primary_news_sources', 'text[]').notNullable();
    table.specificType('blind_spots', 'text[]').notNullable();
    table.timestamp('last_assessed_at').notNullable();
    table.timestamps(true, true);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('bias_profiles');
}; 