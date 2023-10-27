const logger = require('../util/logger');

module.exports = (err, req, res, next) => {
  let status;
  let message;

  status = err.status || 500;
  message = status === 500 ? 'Internal Server Error' : err.message;

  logger.error(message, err);

  return res.status(status).json({ message });
};
