require('dotenv').config();

const express = require('express');
const authMiddleware = require('./middleware/firebaseAuth');
const errorHandlerMiddleware = require('./middleware/errorHandler');
const { connection, closeDbConnection } = require('./config/db');
const startCron = require('./cron/index');
const logger = require('./util/logger');

const app = express();

app.get('/status', (req, res) => res.status(200).json({ status: 'UP' }));
app.use('/api/v1', authMiddleware);

app.use(errorHandlerMiddleware);

// Server config
const PORT = 3000;

const exitServer = async (err) => {
  try {
    await closeDbConnection();
    logger.info('[db] db connection closed');
  } catch (e) {
    logger.error('[db] Cannot close db connection', e);
  } finally {
    logger.info('Server closed');
    process.exit(err ? 1 : 0);
  }
};

const shutDown = async (event, app) => {
  logger.info(`${event} event`);
  if (app.server) {
    app.server.close((err) => exitServer(err));
  } else {
    await exitServer();
  }
};

process.on('SIGTERM', () => shutDown('SIGTERM', app));
process.on('SIGINT', () => shutDown('SIGINT', app));

// Start server
const main = async () => {
  try {
    await connection();
    app.server = app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      startCron();
    });
  } catch (err) {
    logger.error('Cannot start server', err);
    try {
      await closeDbConnection();
      logger.info('[db] db connection closed');
    } catch (err) {
      logger.error('[db] Cannot close db connection', err);
    }
    process.exit(1);
  }
};

main().then();
