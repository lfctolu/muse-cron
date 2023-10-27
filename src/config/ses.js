const { SESv2Client } = require('@aws-sdk/client-sesv2');

const sesClient = new SESv2Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KET,
  },
});

module.exports = sesClient;
