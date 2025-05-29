import dotenv from 'dotenv';

dotenv.config();

export interface DatabaseSettings {
  client: string;
  host: string;
  port: number;
  name: string;
  user: string;
  password: string;
  ssl: boolean;
}

export interface GeneralSettings {
  env: string;
  port: number;
}

export interface Config {
  database: DatabaseSettings;
  general: GeneralSettings;
}

const config: Config = {
  database: {
    client: process.env.DB_CLIENT || 'pg',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    name: process.env.DB_NAME || 'perspective_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    ssl: process.env.DB_SSL === 'true',
  },
  general: {
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3000', 10),
  },
};

export default config;
