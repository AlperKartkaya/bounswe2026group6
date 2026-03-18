const path = require('path');

const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

function readNumber(value, fallback) {
  const parsed = Number(value);

  if (Number.isNaN(parsed)) {
    return fallback;
  }

  return parsed;
}

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  appPort: readNumber(process.env.APP_PORT, 3000),
  database: {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: readNumber(process.env.POSTGRES_PORT, 5432),
    database: process.env.POSTGRES_DB || 'neph_db',
    user: process.env.POSTGRES_USER || 'neph_user',
    password: process.env.POSTGRES_PASSWORD || 'neph_pass',
  },
};

module.exports = {
  env,
};
