const express = require('express');
const handlerWrapper = require('./middleware/handlerWrapper');
const emailCron = require('./cron/emailCron');
const pushNotificationCron = require('./cron/pushNotificationCron');

const router = express.Router();

router.post('/round-up-emails', handlerWrapper(async (req, res) => {
  await emailCron.sendRoundUpEmails();
  res.status(204).json();
}));

router.post('/add-friends-pushes', handlerWrapper(async (req, res) => {
  await pushNotificationCron.sendAddFriendsPushes();
  res.status(204).json();
}));

router.post('/share-wishlist-pushes', handlerWrapper(async (req, res) => {
  await pushNotificationCron.sendShareWishlistPushes();
  res.status(204).json();
}));

router.post('/friend-event-pushes', handlerWrapper(async (req, res) => {
  await pushNotificationCron.sendFriendEventPushes();
  res.status(204).json();
}));

router.post('/most-added-pushes', handlerWrapper(async (req, res) => {
  await pushNotificationCron.sendMostAddedPushes();
  res.status(204).json();
}));

router.post('/check-trending-pushes', handlerWrapper(async (req, res) => {
  await pushNotificationCron.sendCheckTrendingPushes();
  res.status(204).json();
}));

module.exports = router;
