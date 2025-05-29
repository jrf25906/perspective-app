/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('challenge_submissions', function (table) {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable();
    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.integer('challenge_id').unsigned().notNullable();
    table.foreign('challenge_id').references('id').inTable('challenges').onDelete('CASCADE');
    table.timestamp('started_at').defaultTo(knex.fn.now());
    table.timestamp('completed_at');
    table.jsonb('answer').notNullable();
    table.boolean('is_correct');
    table.integer('time_spent_seconds').notNullable().defaultTo(0);
    table.integer('xp_earned').notNullable().defaultTo(0);
    table.text('feedback');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    
    // Indexes
    table.index(['user_id', 'created_at']);
    table.index(['challenge_id', 'created_at']);
    // Note: One submission per day per user is enforced in application logic
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('challenge_submissions');
}; 