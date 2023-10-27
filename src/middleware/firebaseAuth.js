const admin = require('../config/firebase.js');
const logger = require('../util/logger');
const { UnauthorizedError } = require('../error/index');

module.exports = async (req) => {
  const token = req.header('Authorization')?.split('Bearer ')[1];

  try {
    req.currentUser = await admin.auth().verifyIdToken(token);
  } catch (err) {
    logger.error('Error on firebase auth', err);
    throw new UnauthorizedError('Unauthorized');
  }
};
