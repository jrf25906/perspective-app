/**
 * Add performance indexes for commonly queried fields
 * These indexes will significantly improve query performance for the refactored concurrent operations
 */

exports.up = function(knex) {
  return Promise.all([
    // Content table indexes
    knex.schema.table('content', function(table) {
      table.index('url', 'idx_content_url');
      table.index(['is_active', 'is_verified'], 'idx_content_active_verified');
      table.index('published_at', 'idx_content_published_at');
      table.index('bias_rating', 'idx_content_bias_rating');
      table.index(['source_id', 'published_at'], 'idx_content_source_published');
    }),

    // User responses indexes
    knex.schema.table('user_responses', function(table) {
      table.index(['user_id', 'created_at'], 'idx_user_responses_user_created');
      table.index(['user_id', 'is_correct'], 'idx_user_responses_user_correct');
      table.index('challenge_id', 'idx_user_responses_challenge');
    }),

    // Challenge submissions indexes
    knex.schema.table('challenge_submissions', function(table) {
      table.index(['user_id', 'created_at'], 'idx_challenge_submissions_user_created');
      table.index(['user_id', 'difficulty'], 'idx_challenge_submissions_user_difficulty');
      table.index(['user_id', 'type'], 'idx_challenge_submissions_user_type');
    }),

    // Echo score history indexes
    knex.schema.table('echo_score_history', function(table) {
      table.index(['user_id', 'score_date'], 'idx_echo_score_history_user_date');
      table.index('score_date', 'idx_echo_score_history_date');
    }),

    // User sessions indexes
    knex.schema.table('user_sessions', function(table) {
      table.index(['user_id', 'session_start'], 'idx_user_sessions_user_start');
      table.index('session_start', 'idx_user_sessions_start');
    }),

    // User reading activity indexes
    knex.schema.table('user_reading_activity', function(table) {
      table.index(['user_id', 'created_at'], 'idx_user_reading_activity_user_created');
      table.index('article_id', 'idx_user_reading_activity_article');
    }),

    // News articles indexes
    knex.schema.table('news_articles', function(table) {
      table.index('source', 'idx_news_articles_source');
      table.index('bias_rating', 'idx_news_articles_bias_rating');
    }),

    // Daily challenge selections indexes
    knex.schema.table('daily_challenge_selections', function(table) {
      table.index(['user_id', 'selection_date'], 'idx_daily_challenge_selections_user_date');
    })
  ]);
};

exports.down = function(knex) {
  return Promise.all([
    // Drop content indexes
    knex.schema.table('content', function(table) {
      table.dropIndex('url', 'idx_content_url');
      table.dropIndex(['is_active', 'is_verified'], 'idx_content_active_verified');
      table.dropIndex('published_at', 'idx_content_published_at');
      table.dropIndex('bias_rating', 'idx_content_bias_rating');
      table.dropIndex(['source_id', 'published_at'], 'idx_content_source_published');
    }),

    // Drop user responses indexes
    knex.schema.table('user_responses', function(table) {
      table.dropIndex(['user_id', 'created_at'], 'idx_user_responses_user_created');
      table.dropIndex(['user_id', 'is_correct'], 'idx_user_responses_user_correct');
      table.dropIndex('challenge_id', 'idx_user_responses_challenge');
    }),

    // Drop challenge submissions indexes
    knex.schema.table('challenge_submissions', function(table) {
      table.dropIndex(['user_id', 'created_at'], 'idx_challenge_submissions_user_created');
      table.dropIndex(['user_id', 'difficulty'], 'idx_challenge_submissions_user_difficulty');
      table.dropIndex(['user_id', 'type'], 'idx_challenge_submissions_user_type');
    }),

    // Drop echo score history indexes
    knex.schema.table('echo_score_history', function(table) {
      table.dropIndex(['user_id', 'score_date'], 'idx_echo_score_history_user_date');
      table.dropIndex('score_date', 'idx_echo_score_history_date');
    }),

    // Drop user sessions indexes
    knex.schema.table('user_sessions', function(table) {
      table.dropIndex(['user_id', 'session_start'], 'idx_user_sessions_user_start');
      table.dropIndex('session_start', 'idx_user_sessions_start');
    }),

    // Drop user reading activity indexes
    knex.schema.table('user_reading_activity', function(table) {
      table.dropIndex(['user_id', 'created_at'], 'idx_user_reading_activity_user_created');
      table.dropIndex('article_id', 'idx_user_reading_activity_article');
    }),

    // Drop news articles indexes
    knex.schema.table('news_articles', function(table) {
      table.dropIndex('source', 'idx_news_articles_source');
      table.dropIndex('bias_rating', 'idx_news_articles_bias_rating');
    }),

    // Drop daily challenge selections indexes
    knex.schema.table('daily_challenge_selections', function(table) {
      table.dropIndex(['user_id', 'selection_date'], 'idx_daily_challenge_selections_user_date');
    })
  ]);
}; 