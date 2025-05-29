/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('content', function (table) {
    table.increments('id').primary();
    table.integer('source_id').unsigned().notNullable();
    table.foreign('source_id').references('id').inTable('news_sources').onDelete('CASCADE');
    table.enum('type', ['news_article', 'opinion', 'analysis', 'fact_check']).notNullable();
    table.string('headline', 500).notNullable();
    table.string('subheadline', 700);
    table.string('author', 200);
    table.text('excerpt').notNullable();
    table.text('full_text');
    table.string('url').notNullable();
    table.string('image_url');
    table.timestamp('published_at').notNullable();
    table.enum('bias_rating', [
      'far_left',
      'left',
      'left_center',
      'center',
      'right_center',
      'right',
      'far_right'
    ]).notNullable();
    table.specificType('topics', 'text[]').notNullable();
    table.specificType('keywords', 'text[]').notNullable();
    table.float('sentiment_score'); // -1 to 1
    table.boolean('is_verified').defaultTo(false);
    table.boolean('is_active').defaultTo(true);
    table.timestamps(true, true);
    
    // Indexes
    table.index(['bias_rating', 'published_at']);
    table.index(['source_id', 'published_at']);
    table.index('is_active');
    table.index('published_at');
    // GIN index for array search (PostgreSQL specific)
    table.index('topics', null, 'gin');
    table.index('keywords', null, 'gin');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('content');
}; 