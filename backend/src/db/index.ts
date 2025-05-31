import knex from 'knex';
import config from '../config';
import logger from '../utils/logger';

// Determine database client from environment
const dbClient = process.env.DB_CLIENT || 'pg';

// Configure database connection based on client type
const dbConfig = dbClient === 'sqlite3' ? {
  client: 'sqlite3',
  connection: {
    filename: './dev.sqlite3'
  },
  useNullAsDefault: true,
  pool: {
    min: 2,
    max: 10,
  },
  migrations: {
    directory: './migrations',
    tableName: 'knex_migrations',
  },
  seeds: {
    directory: './seeds',
  },
} : {
  client: 'pg',
  connection: {
    host: config.database.host,
    port: config.database.port,
    user: config.database.user,
    password: config.database.password,
    database: config.database.name,
    ssl: config.database.ssl ? { rejectUnauthorized: false } : false,
  },
  pool: {
    min: 2,
    max: 10,
  },
  migrations: {
    directory: './migrations',
    tableName: 'knex_migrations',
  },
  seeds: {
    directory: './seeds',
  },
};

const db = knex(dbConfig);

// Test database connection
db.raw('SELECT 1')
  .then(() => {
    logger.info(`Database connected successfully (${dbClient})`);
  })
  .catch((err: Error) => {
    logger.error('Database connection failed:', err);
    process.exit(1);
  });

export default db; 