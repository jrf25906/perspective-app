/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  // Add total_xp_earned column to user_challenge_stats
  await knex.schema.table('user_challenge_stats', function(table) {
    table.integer('total_xp_earned').notNullable().defaultTo(0);
  });
  
  // Add performance index
  await knex.schema.table('user_challenge_stats', function(table) {
    table.index(['user_id', 'total_xp_earned']); // For leaderboard queries
  });
  
  // Backfill existing data using simpler approach
  try {
    await knex.raw(`
      UPDATE user_challenge_stats 
      SET total_xp_earned = COALESCE((
        SELECT SUM(xp_earned)
        FROM challenge_submissions
        WHERE challenge_submissions.user_id = user_challenge_stats.user_id
      ), 0)
    `);
  } catch (error) {
    console.log('Warning: Could not backfill total_xp_earned data:', error.message);
  }
  
  // Add index for challenge_submissions if it doesn't exist
  try {
    await knex.schema.table('challenge_submissions', function(table) {
      table.index(['user_id', 'created_at']);
    });
  } catch (error) {
    console.log('Index challenge_submissions(user_id, created_at) might already exist, skipping...');
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  // Drop indexes
  try {
    await knex.schema.table('challenge_submissions', function(table) {
      table.dropIndex(['user_id', 'created_at']);
    });
  } catch (error) {
    // Index might not exist, ignore
  }
  
  try {
    await knex.schema.table('user_challenge_stats', function(table) {
      table.dropIndex(['user_id', 'total_xp_earned']);
    });
  } catch (error) {
    // Index might not exist, ignore
  }
  
  await knex.schema.table('user_challenge_stats', function(table) {
    table.dropColumn('total_xp_earned');
  });
}; 