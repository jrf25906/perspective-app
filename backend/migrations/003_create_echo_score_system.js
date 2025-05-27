/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema
    // Add Echo Score fields to users table
    .alterTable('users', function (table) {
      table.decimal('echo_score', 5, 2).defaultTo(0);
      table.json('bias_profile'); // Store initial bias assessment results
      table.string('preferred_challenge_time'); // For personalized notifications
      table.integer('current_streak').defaultTo(0);
      table.date('last_activity_date');
    })
    
    // News Articles table for content curation
    .createTable('news_articles', function (table) {
      table.increments('id').primary();
      table.string('title').notNullable();
      table.text('content').notNullable();
      table.string('source').notNullable();
      table.string('author');
      table.string('url').notNullable().unique();
      table.string('image_url');
      table.string('category'); // Politics, Economics, etc.
      table.decimal('bias_rating', 3, 1); // -3.0 to +3.0 (left to right)
      table.string('bias_source'); // AllSides, Ad Fontes, etc.
      table.json('tags'); // Array of topic tags
      table.timestamp('published_at').notNullable();
      table.boolean('is_active').defaultTo(true);
      table.timestamps(true, true);
    })
    
    // Enhanced challenges table
    .createTable('challenges_v2', function (table) {
      table.increments('id').primary();
      table.string('type').notNullable(); // 'bias_swap', 'logic_puzzle', 'synthesis', etc.
      table.string('title').notNullable();
      table.text('prompt').notNullable();
      table.json('content'); // Flexible content structure for different challenge types
      table.json('options'); // Multiple choice options if applicable
      table.string('correct_answer');
      table.text('explanation');
      table.integer('difficulty_level').defaultTo(1); // 1-5 scale
      table.json('required_articles'); // References to news_articles
      table.boolean('is_active').defaultTo(true);
      table.timestamps(true, true);
    })
    
    // User challenge responses with detailed tracking
    .createTable('user_responses', function (table) {
      table.increments('id').primary();
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
      table.integer('challenge_id').unsigned().references('id').inTable('challenges_v2').onDelete('CASCADE');
      table.string('user_answer');
      table.boolean('is_correct');
      table.integer('time_spent_seconds'); // For switch speed calculation
      table.integer('attempts').defaultTo(1);
      table.json('interaction_data'); // Store detailed interaction patterns
      table.timestamps(true, true);
    })
    
    // Echo Score history for trend tracking
    .createTable('echo_score_history', function (table) {
      table.increments('id').primary();
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
      table.decimal('total_score', 5, 2).notNullable();
      table.decimal('diversity_score', 5, 2);
      table.decimal('accuracy_score', 5, 2);
      table.decimal('switch_speed_score', 5, 2);
      table.decimal('consistency_score', 5, 2);
      table.decimal('improvement_score', 5, 2);
      table.json('calculation_details'); // Store the raw metrics used
      table.date('score_date').notNullable();
      table.timestamps(true, true);
    })
    
    // User reading activity for diversity calculation
    .createTable('user_reading_activity', function (table) {
      table.increments('id').primary();
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
      table.integer('article_id').unsigned().references('id').inTable('news_articles').onDelete('CASCADE');
      table.integer('time_spent_seconds');
      table.decimal('completion_percentage', 5, 2); // How much of article was read
      table.string('source_type'); // 'challenge', 'browse', 'recommendation'
      table.timestamps(true, true);
    })
    
    // User sessions for consistency tracking
    .createTable('user_sessions', function (table) {
      table.increments('id').primary();
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
      table.timestamp('session_start').notNullable();
      table.timestamp('session_end');
      table.integer('challenges_completed').defaultTo(0);
      table.integer('articles_read').defaultTo(0);
      table.json('session_data'); // Store session-specific metrics
      table.timestamps(true, true);
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema
    .dropTable('user_sessions')
    .dropTable('user_reading_activity')
    .dropTable('echo_score_history')
    .dropTable('user_responses')
    .dropTable('challenges_v2')
    .dropTable('news_articles')
    .alterTable('users', function (table) {
      table.dropColumn('echo_score');
      table.dropColumn('bias_profile');
      table.dropColumn('preferred_challenge_time');
      table.dropColumn('current_streak');
      table.dropColumn('last_activity_date');
    });
}; 