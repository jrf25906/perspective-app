/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('challenges', function (table) {
    table.increments('id').primary();
    table.enum('type', [
      'bias_swap',
      'logic_puzzle',
      'data_literacy',
      'counter_argument',
      'synthesis',
      'ethical_dilemma'
    ]).notNullable();
    table.enum('difficulty', ['beginner', 'intermediate', 'advanced']).notNullable();
    table.string('title', 200).notNullable();
    table.text('description').notNullable();
    table.text('instructions').notNullable();
    table.jsonb('content').notNullable(); // Articles, questions, etc.
    table.jsonb('correct_answer'); // For objective challenges
    table.text('explanation');
    table.jsonb('skills_tested').notNullable();
    table.integer('estimated_time_minutes').notNullable();
    table.integer('xp_reward').notNullable();
    table.boolean('is_active').defaultTo(true);
    table.timestamps(true, true);
    
    // Indexes
    table.index(['type', 'is_active']);
    table.index(['difficulty', 'is_active']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('challenges');
}; 