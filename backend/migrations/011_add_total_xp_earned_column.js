/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  // Add total_xp_earned column to user_challenge_stats
  await knex.schema.table('user_challenge_stats', function(table) {
    table.integer('total_xp_earned').notNullable().defaultTo(0);
    table.index(['user_id', 'total_xp_earned']); // For leaderboard queries
  });
  
  // Backfill existing data
  const client = knex.client.config.client;
  
  if (client === 'sqlite3') {
    // SQLite doesn't support table aliases in UPDATE
    await knex.raw(`
      UPDATE user_challenge_stats
      SET total_xp_earned = (
        SELECT COALESCE(SUM(xp_earned), 0)
        FROM challenge_submissions
        WHERE challenge_submissions.user_id = user_challenge_stats.user_id
      )
    `);
  } else {
    await knex.raw(`
      UPDATE user_challenge_stats ucs
      SET total_xp_earned = (
        SELECT COALESCE(SUM(xp_earned), 0)
        FROM challenge_submissions
        WHERE user_id = ucs.user_id
      )
    `);
  }
  
  // Create trigger for SQLite (if using SQLite)
  if (client === 'sqlite3') {
    await knex.raw(`
      CREATE TRIGGER update_total_xp_earned
      AFTER INSERT ON challenge_submissions
      FOR EACH ROW
      BEGIN
        UPDATE user_challenge_stats 
        SET total_xp_earned = total_xp_earned + NEW.xp_earned
        WHERE user_id = NEW.user_id;
      END;
    `);
  } else if (client === 'pg' || client === 'postgresql') {
    // PostgreSQL trigger
    await knex.raw(`
      CREATE OR REPLACE FUNCTION update_user_total_xp()
      RETURNS TRIGGER AS $$
      BEGIN
        UPDATE user_challenge_stats 
        SET total_xp_earned = total_xp_earned + NEW.xp_earned
        WHERE user_id = NEW.user_id;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);
    
    await knex.raw(`
      CREATE TRIGGER update_total_xp_earned
      AFTER INSERT ON challenge_submissions
      FOR EACH ROW
      EXECUTE FUNCTION update_user_total_xp();
    `);
  }
  
  // Add index for performance - use try-catch for existing index
  try {
    await knex.schema.table('challenge_submissions', function(table) {
      table.index(['user_id', 'created_at']);
    });
  } catch (error) {
    // Index might already exist, ignore the error
    console.log('Index challenge_submissions(user_id, created_at) might already exist, skipping...');
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  const client = knex.client.config.client;
  
  // Drop triggers
  if (client === 'sqlite3') {
    await knex.raw('DROP TRIGGER IF EXISTS update_total_xp_earned');
  } else if (client === 'pg' || client === 'postgresql') {
    await knex.raw('DROP TRIGGER IF EXISTS update_total_xp_earned ON challenge_submissions');
    await knex.raw('DROP FUNCTION IF EXISTS update_user_total_xp()');
  }
  
  // Drop indexes - use try-catch in case they don't exist
  try {
    await knex.schema.table('challenge_submissions', function(table) {
      table.dropIndex(['user_id', 'created_at']);
    });
  } catch (error) {
    // Index might not exist, ignore
  }
  
  await knex.schema.table('user_challenge_stats', function(table) {
    table.dropIndex(['user_id', 'total_xp_earned']);
    table.dropColumn('total_xp_earned');
  });
}; 