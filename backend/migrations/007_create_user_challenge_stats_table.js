/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('user_challenge_stats', function (table) {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable().unique();
    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.integer('total_completed').notNullable().defaultTo(0);
    table.integer('total_correct').notNullable().defaultTo(0);
    table.integer('current_streak').notNullable().defaultTo(0);
    table.integer('longest_streak').notNullable().defaultTo(0);
    table.date('last_challenge_date');
    table.jsonb('difficulty_performance').notNullable().defaultTo('{}');
    table.jsonb('type_performance').notNullable().defaultTo('{}');
    table.timestamps(true, true);
    
    // Indexes
    table.index('user_id');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('user_challenge_stats');
}; 