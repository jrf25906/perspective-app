exports.up = async function(knex) {
  // Add columns to users table if they don't exist
  const usersTable = await knex.schema.hasTable('users');
  if (usersTable) {
    await knex.schema.table('users', function(table) {
      table.string('role', 50).defaultTo('user').notNullable();
      table.timestamp('deleted_at').nullable();
    });
  }

  // Create user_activities table for activity logging
  const userActivitiesExists = await knex.schema.hasTable('user_activities');
  if (!userActivitiesExists) {
    await knex.schema.createTable('user_activities', function(table) {
      table.increments('id').primary();
      table.integer('user_id').unsigned().notNullable();
      table.string('action', 100).notNullable();
      table.string('resource', 255).notNullable();
      table.string('method', 10).notNullable();
      table.string('ip_address', 45).nullable();
      table.text('user_agent').nullable();
      table.integer('status_code').nullable();
      table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable();
      
      table.index(['user_id', 'created_at']);
      table.index('action');
    });
  }

  // Create api_keys table for API key authentication
  const apiKeysExists = await knex.schema.hasTable('api_keys');
  if (!apiKeysExists) {
    await knex.schema.createTable('api_keys', function(table) {
      table.increments('id').primary();
      table.integer('user_id').unsigned().notNullable();
      table.string('name', 100).notNullable();
      table.string('key_hash', 64).notNullable().unique();
      table.timestamp('expires_at').notNullable();
      table.boolean('is_active').defaultTo(true).notNullable();
      table.timestamp('last_used_at').nullable();
      table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable();
      table.timestamp('updated_at').defaultTo(knex.fn.now()).notNullable();
      
      table.index('key_hash');
      table.index(['user_id', 'is_active']);
    });
  }

  // Create notifications table
  const notificationsExists = await knex.schema.hasTable('notifications');
  if (!notificationsExists) {
    await knex.schema.createTable('notifications', function(table) {
      table.increments('id').primary();
      table.integer('user_id').unsigned().notNullable();
      table.string('type').notNullable();
      table.string('title', 255).notNullable();
      table.text('message').notNullable();
      table.string('action_url', 500).nullable();
      table.boolean('is_read').defaultTo(false).notNullable();
      table.timestamp('read_at').nullable();
      table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable();
      
      table.index(['user_id', 'is_read']);
      table.index(['user_id', 'created_at']);
      table.index('type');
    });
  }

  // Create notification_preferences table
  const notificationPreferencesExists = await knex.schema.hasTable('notification_preferences');
  if (!notificationPreferencesExists) {
    await knex.schema.createTable('notification_preferences', function(table) {
      table.increments('id').primary();
      table.integer('user_id').unsigned().notNullable().unique();
      table.boolean('echo_score_updates').defaultTo(true).notNullable();
      table.boolean('challenge_completions').defaultTo(true).notNullable();
      table.boolean('achievements').defaultTo(true).notNullable();
      table.boolean('content_recommendations').defaultTo(true).notNullable();
      table.boolean('system_announcements').defaultTo(true).notNullable();
      table.boolean('email_notifications').defaultTo(false).notNullable();
      table.boolean('push_notifications').defaultTo(true).notNullable();
      table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable();
      table.timestamp('updated_at').defaultTo(knex.fn.now()).notNullable();
    });
  }

  // Add foreign key constraints after all tables are created
  if (usersTable) {
    // Add foreign keys for tables that reference users
    const hasUserActivitiesForeignKey = await knex.schema.hasTable('user_activities');
    if (hasUserActivitiesForeignKey) {
      await knex.schema.alterTable('user_activities', function(table) {
        table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
      });
    }

    const hasApiKeysForeignKey = await knex.schema.hasTable('api_keys');
    if (hasApiKeysForeignKey) {
      await knex.schema.alterTable('api_keys', function(table) {
        table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
      });
    }

    const hasNotificationsForeignKey = await knex.schema.hasTable('notifications');
    if (hasNotificationsForeignKey) {
      await knex.schema.alterTable('notifications', function(table) {
        table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
      });
    }

    const hasNotificationPreferencesForeignKey = await knex.schema.hasTable('notification_preferences');
    if (hasNotificationPreferencesForeignKey) {
      await knex.schema.alterTable('notification_preferences', function(table) {
        table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
      });
    }
  }
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('notification_preferences');
  await knex.schema.dropTableIfExists('notifications');
  await knex.schema.dropTableIfExists('api_keys');
  await knex.schema.dropTableIfExists('user_activities');
  
  const usersTable = await knex.schema.hasTable('users');
  if (usersTable) {
    await knex.schema.table('users', function(table) {
      table.dropColumn('role');
      table.dropColumn('deleted_at');
    });
  }
}; 