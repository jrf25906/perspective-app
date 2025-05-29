/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('daily_challenge_selections', function (table) {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable();
    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.integer('selected_challenge_id').unsigned().notNullable();
    table.foreign('selected_challenge_id').references('id').inTable('challenges').onDelete('CASCADE');
    table.date('selection_date').notNullable();
    table.string('selection_reason', 100).notNullable();
    table.integer('difficulty_adjustment').notNullable().defaultTo(0);
    table.timestamps(true, true);
    
    // Indexes
    table.unique(['user_id', 'selection_date']);
    table.index(['selection_date']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('daily_challenge_selections');
}; 