/**
 * Migration: Add total_xp_earned column to user_challenge_stats
 * 
 * CRITICAL FIX: This migration was missing, causing user creation failures
 * when backend tries to calculate totalXpEarned for API responses.
 * 
 * Architecture: Follows Single Responsibility - only handles XP earned tracking
 */

exports.up = function(knex) {
  return knex.schema.alterTable('user_challenge_stats', function(table) {
    // Add total XP earned column with proper default
    table.integer('total_xp_earned').notNullable().defaultTo(0);
    
    // Add index for performance on XP queries
    table.index('total_xp_earned');
  }).then(async () => {
    // Backfill existing data from challenge_submissions
    // This ensures data consistency for existing users
    const backfillQuery = `
      UPDATE user_challenge_stats 
      SET total_xp_earned = COALESCE((
        SELECT SUM(xp_earned) 
        FROM challenge_submissions 
        WHERE challenge_submissions.user_id = user_challenge_stats.user_id
      ), 0)
    `;
    
    await knex.raw(backfillQuery);
    
    console.log('✅ Successfully backfilled total_xp_earned for existing users');
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('user_challenge_stats', function(table) {
    table.dropIndex('total_xp_earned');
    table.dropColumn('total_xp_earned');
  });
};

// Migration validation - ensures the column exists after migration
exports.validate = async function(knex) {
  const hasColumn = await knex.schema.hasColumn('user_challenge_stats', 'total_xp_earned');
  if (!hasColumn) {
    throw new Error('Migration failed: total_xp_earned column not created');
  }
  
  // Verify the column has proper default
  const columnInfo = await knex('user_challenge_stats').columnInfo();
  const column = columnInfo.total_xp_earned;
  
  if (column.defaultValue !== 0 && column.defaultValue !== '0') {
    console.warn('Warning: total_xp_earned column may not have proper default value');
  }
  
  console.log('✅ Migration validation successful');
}; 