exports.up = function(knex) {
  return knex.schema
    // Create ingestion logs table
    .createTable('ingestion_logs', function(table) {
      table.increments('id').primary();
      table.timestamp('timestamp').notNullable();
      table.integer('ingested').defaultTo(0);
      table.integer('failed').defaultTo(0);
      table.integer('duplicates').defaultTo(0);
      table.float('duration'); // in seconds
      table.text('error');
      table.json('topics');
      table.index('timestamp');
    })
    // Create ingestion statistics table
    .createTable('ingestion_stats', function(table) {
      table.increments('id').primary();
      table.timestamp('timestamp').notNullable();
      table.integer('total_articles');
      table.integer('articles_last_24h');
      table.integer('unverified_count');
      table.json('stats_json');
      table.index('timestamp');
    })
    // Create system configuration table
    .createTable('system_config', function(table) {
      table.string('key').primary();
      table.text('value');
      table.timestamp('updated_at').defaultTo(knex.fn.now());
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('system_config')
    .dropTableIfExists('ingestion_stats')
    .dropTableIfExists('ingestion_logs');
}; 