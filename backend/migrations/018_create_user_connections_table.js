/**
 * Migration: Create User Connections Table
 * 
 * This table manages social connections between users (friends, followers, etc.)
 * Used by LeaderboardService for friends leaderboards and social features.
 */

exports.up = function(knex) {
  return knex.schema.createTable('user_connections', function(table) {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable();
    table.integer('friend_id').unsigned().notNullable();
    table.string('status', 20).notNullable().defaultTo('pending');
    table.string('connection_type', 20).defaultTo('friend');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    // Foreign key constraints
    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.foreign('friend_id').references('id').inTable('users').onDelete('CASCADE');
    
    // Unique constraint to prevent duplicate connections
    table.unique(['user_id', 'friend_id'], 'unique_connection');
    
    // Check constraint to prevent self-connections
    table.check('user_id != friend_id', [], 'no_self_connection');
    
    // Indexes for performance
    table.index('user_id');
    table.index('friend_id');
    table.index('status');
    table.index(['user_id', 'status']);
    table.index(['friend_id', 'status']);
    
    // Comment for documentation
    table.comment('Manages social connections between users for friends features');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('user_connections');
}; 