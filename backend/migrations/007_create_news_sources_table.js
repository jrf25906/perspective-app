/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('news_sources', function (table) {
    table.increments('id').primary();
    table.string('name', 200).notNullable().unique();
    table.string('domain', 255).notNullable().unique();
    table.enum('bias_rating', [
      'far_left',
      'left',
      'left_center',
      'center',
      'right_center',
      'right',
      'far_right'
    ]).notNullable();
    table.float('credibility_score').notNullable(); // 0-100
    table.text('description');
    table.string('logo_url');
    table.boolean('is_active').defaultTo(true);
    table.timestamps(true, true);
    
    // Indexes
    table.index('bias_rating');
    table.index('is_active');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('news_sources');
}; 