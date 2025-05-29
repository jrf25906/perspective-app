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

declare const config: Config;
export default config;
