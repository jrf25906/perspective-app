/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('echo_scores', function (table) {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable();
    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.integer('total_score').notNullable();
    table.integer('diversity_score').notNullable();
    table.integer('accuracy_score').notNullable();
    table.integer('switch_speed_score').notNullable();
    table.integer('consistency_score').notNullable();
    table.integer('improvement_score').notNullable();
    table.timestamp('last_calculated_at').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    
    // Indexes
    table.index(['user_id', 'created_at']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('echo_scores');
}; 