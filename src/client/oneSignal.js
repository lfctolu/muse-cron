const axios = require('axios');
const apiClient = axios.create({
  baseURL: process.env.ONE_SIGNAL_API_URL,
  headers: {
    Authorization: `Basic ${process.env.ONE_SIGNAL_API_KEY}`,
    'Content-Type': 'application/json',
  },
});

const sendPushes = async (targetIds, text, data) => apiClient.post('/notifications', {
  app_id: process.env.ONE_SIGNAL_APP_ID,
  name: 'INTERNAL_CAMPAIGN_NAME',
  contents: {
    en: text,
  },
  include_subscription_ids: targetIds,
  data,
});

module.exports = {
  sendPushes,
};
