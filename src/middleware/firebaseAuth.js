const admin = require('../config/firebase.js');
const logger = require('../util/logger');

module.exports = async (req, res, next) => {
  const token = req.header('Authorization')?.split('Bearer ')[1];

  try {
    req.currentUser = await admin.auth().verifyIdToken(token);

    if (req.currentUser.role !== 'ADMIN') {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }

    next();
  } catch (err) {
    logger.error('Error on firebase auth', err);
    res.status(401).json({ message: 'Unauthorized' });
  }
};
