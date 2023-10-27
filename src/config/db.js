const { Sequelize } = require('sequelize');
const logger = require('../util/logger');

const sequelize = new Sequelize(
  process.env.DATABASE_NAME,
  process.env.DATABASE_USERNAME,
  process.env.DATABASE_PASSWORD,
  {
    host: process.env.DATABASE_HOST,
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'production' ? false : logger.debug,
  },
);

const closeDbConnection = async () => {
  await sequelize.close();
};

// Initiate database connection
const connection = async () => {
  try {
    await sequelize.authenticate();

    logger.info(`[db] database ready`);
  } catch (err) {
    logger.error(`[db] Unable to connect to database`, err);

    throw err;
  }
};

module.exports = { connection, closeDbConnection, sequelize };
