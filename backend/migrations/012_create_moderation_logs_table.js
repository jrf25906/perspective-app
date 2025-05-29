/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('moderation_logs', function (table) {
    table.increments('id').primary();
    table.integer('content_id').unsigned();
    table.foreign('content_id').references('id').inTable('content').onDelete('SET NULL');
    table.string('action', 50).notNullable(); // approve, reject, delete
    table.text('reason').notNullable();
    table.integer('moderator_id').unsigned();
    table.foreign('moderator_id').references('id').inTable('users').onDelete('SET NULL');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    
    // Indexes
    table.index('content_id');
    table.index('action');
    table.index('created_at');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('moderation_logs');
}; 