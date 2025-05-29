/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('content_views', function (table) {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable();
    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.integer('content_id').unsigned().notNullable();
    table.foreign('content_id').references('id').inTable('content').onDelete('CASCADE');
    table.timestamp('viewed_at').defaultTo(knex.fn.now());
    
    // Indexes
    table.index(['user_id', 'viewed_at']);
    table.index(['content_id', 'viewed_at']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('content_views');
}; 