/**
 * Migration: Create XP Transactions Table
 * 
 * This table tracks all XP (experience points) awarded to users
 * for challenge completions, achievements, and other activities.
 */

exports.up = function(knex) {
  return knex.schema.createTable('xp_transactions', function(table) {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable();
    table.integer('amount').notNullable();
    table.string('reason').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    
    // Foreign key constraint
    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
    
    // Indexes for performance
    table.index('user_id');
    table.index('created_at');
    table.index(['user_id', 'created_at']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('xp_transactions');
}; 