const admin = require('firebase-admin');
const logger = require('../util/logger');

// todo: check if init completed in index.js like for db
try {
  admin.initializeApp({
    credential: admin.credential.cert(
      JSON.parse(Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT, 'base64').toString('utf8')),
    ),
  });
} catch (err) {
  logger.error(`Firebase init app error`, err);
}

module.exports = admin;
