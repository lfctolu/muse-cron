const cron = require('node-cron');
const profileRepository = require('../repository/profileRepository');
const wishlistRepository = require('../repository/wishlistRepository');
const logger = require('../util/logger');
const dayjs = require('dayjs');
const { getTotalPages } = require('../util/pageUtil');
const itemRepository = require('../repository/itemRepository');
const oneSignal = require('../client/oneSignal');
const asyncQueue = require('async/queue');
const chunk = require('lodash/chunk');

const FRIEND_COUNT = 10;
const SIZE = 100;
const TYPE = {
  ADD_FRIENDS: 'ADD_FRIENDS',
  SHARE_WISHLIST: 'SHARE_WISHLIST',
  FRIEND_EVENT: 'FRIEND_EVENT',
  CHECK_MOST_ADDED: 'CHECK_MOST_ADDED',
  CHECK_TRENDING: 'CHECK_TRENDING',
};

const sendAddFriendsPushes = async () => {
  const date = dayjs().startOf('hour').subtract(1, 'month');
  const to = date.unix();
  const from = date.subtract(1, 'day').unix();
  const count = await profileRepository.countForPushFriend({ from, to, count: FRIEND_COUNT });
  const pages = getTotalPages(count, SIZE);
  const queue = asyncQueue(
    ({ playerId, text, data }) => oneSignal.sendPushes([playerId], text, data),
    SIZE,
  );
  queue.error((err, task) => logger.error(`Error on sending ${TYPE.ADD_FRIENDS} push to ${task.playerId}`, err));

  for (let i = 0; i < pages; i++) {
    try {
      const data = await createAddFriendsPushData({
        from, to, count: FRIEND_COUNT, limit: SIZE, offset: SIZE * i,
      });

      queue.push(data);
    } catch (err) {
      logger.error(`Error on creating ${TYPE.ADD_FRIENDS} pushes`, err);
    }
  }

  await queue.drain();
};

const sendShareWishlistPushes = async () => {
  const date = dayjs().startOf('hour').subtract(1, 'day');
  const to = date.unix();
  const from = date.subtract(1, 'hour').add(1, 'ms').unix();
  const count = await wishlistRepository.countForPushShare(from, to);
  const pages = getTotalPages(count, SIZE);
  const queue = asyncQueue(
    ({ playerId, text, data }) => oneSignal.sendPushes([playerId], text, data),
    SIZE,
  );
  queue.error((err, task) => logger.error(`Error on sending ${TYPE.SHARE_WISHLIST} push to ${task.playerId}`, err));

  for (let i = 0; i < pages; i++) {
    try {
      const data = await createShareWishlistPushData({ from, to, limit: SIZE, offset: SIZE * i });

      queue.push(data);
    } catch (err) {
      logger.error(`Error on sending ${TYPE.SHARE_WISHLIST} pushes`, err);
    }
  }

  await queue.drain();
};

const sendFriendEventPushes = async () => {
  const date = dayjs().startOf('hour').add(14, 'day');
  const to = date.unix();
  const from = date.subtract(4, 'hour').unix();
  const count = await wishlistRepository.countForPushEvent(from, to);
  const pages = getTotalPages(count, SIZE);
  const queue = asyncQueue(
    ({ playerIds, text, data }) => oneSignal.sendPushes(playerIds, text, data),
    SIZE,
  );
  queue.error((err, task) =>
    logger.error(`Error on sending ${TYPE.FRIEND_EVENT} pushes for ${task.data?.wishlistId}`, err));

  for (let i = 0; i < pages; i++) {
    try {
      const data = await createFriendEventPushData({ from, to, limit: SIZE, offset: SIZE * i });

      queue.push(data);
    } catch (err) {
      logger.error(`Error on sending ${TYPE.FRIEND_EVENT} pushes`, err);
    }
  }

  await queue.drain();
};

const sendMostAddedPushes = async () => {
  const from = dayjs().startOf('hour').subtract(3, 'day').unix();
  const { content: [item] } = await itemRepository.findAllMostAdded(from, 1, 1);

  if (!item) {
    return;
  }

  const count = await itemRepository.countRefs(item.id, from);

  await oneSignal.sendPushes(undefined,
    `${item.name}. Saved ${count} times. We think you may like this. Check it out in the app`,
    { itemId: item.id, type: TYPE.CHECK_MOST_ADDED },
  );

};

const sendCheckTrendingPushes = async () => {
  const date = dayjs().startOf('hour').subtract(1, 'day');
  const to = date.unix();
  const from = date.subtract(1, 'hour').unix();
  const count = await profileRepository.countForPushTrending(from, to);
  const pages = getTotalPages(count, SIZE);
  const queue = asyncQueue(
    ({ playerIds, text, data }) => oneSignal.sendPushes(playerIds, text, data),
    SIZE,
  );
  queue.error((err, task) => logger.error(`Error on sending ${TYPE.CHECK_TRENDING} push to ${task.playerId}`, err));

  for (let i = 0; i < pages; i++) {
    try {
      const data = await createCheckTrendingPushData({ from, to, limit: SIZE, offset: SIZE * i });

      queue.push(data);
    } catch (err) {
      logger.error(`Error on creating ${TYPE.CHECK_TRENDING} pushes`, err);
    }
  }

  await queue.drain();
};

const createAddFriendsPushData = async ({ from, to, count, limit, offset }) => {
  const data = await profileRepository.getAllForPushFriend({
    from, to, count, limit, offset,
  });

  return data.map(user => ({
    playerId: user.playerID,
    text: `Get your friends & family to see your wishlist. Share your link with them: ${process.env.WEB_DOMAIN}/${user.username}`,
    data: {
      url: `${process.env.WEB_URL}/${user.username}`,
      type: TYPE.ADD_FRIENDS,
    },
  }));
};

const createShareWishlistPushData = async ({ from, to, limit, offset }) => {
  const data = await wishlistRepository.getAllForPushShare({ from, to, limit, offset });
  const playerIdMap = await profileRepository.getPlayerIds(data.map(({ userId }) => userId));

  return data.map(row => ({
    playerId: playerIdMap.get(row.userId),
    text: `Hey, here’s a link to your wishlist ${row.name}, share to your friends for surprises!`,
    data: {
      wishlistId: row.id,
      type: TYPE.SHARE_WISHLIST,
    },
  }));
};

const createFriendEventPushData = async ({ from, to, limit, offset }) => {
  const data = await wishlistRepository.getAllForPushEvent({
    from, to, limit, offset,
  });

  const userIds = [...new Set(data.map(({ userId }) => userId))];
  const idMap = new Map(userIds.map(id => [id, []]));
  const count = await profileRepository.countAllFriends(userIds);
  const pages = getTotalPages(count, 500);

  for (let i = 0; i < pages; i++) {
    const friends = await profileRepository.getFriendPlayerIds(userIds, 500, 500 * i);
    friends.forEach(({ userId, playerID }) => idMap.get(userId).push(playerID));
  }

  const userNameMap = await profileRepository.getNamesAndEmails(userIds);
  userNameMap.forEach(({ name, lastName }, key) =>
    userNameMap.set(key, `${name}${lastName ? ` ${lastName}` : ''}`));

  return data.map(row => ({
    playerIds: idMap.get(row.userId),
    text: `Hey, ${userNameMap.get(row.userId)} has an event in 14 days, see what’s on their wishlist`,
    data: {
      wishlistId: row.id,
      type: TYPE.FRIEND_EVENT,
    },
  })).reduce((prev, curr) => {
    chunk(curr.playerIds, 2000)
      .forEach(ids => prev.push({ ...curr, playerIds: ids }));

    return prev;
  }, []);
};

const createCheckTrendingPushData = async ({ from, to, limit, offset }) => {
  const data = await profileRepository.getAllForPushTrending({
    from, to, limit, offset,
  });

  return {
    playerIds: data.map(user => user.playerID),
    text: `Hey, check out what's trending today for a few wishlist ideas`,
    data: {
      type: TYPE.CHECK_TRENDING,
    },
  };
};

const addFriendTask = cron.schedule(
  '0 0 0 * * *',
  sendAddFriendsPushes,
  { scheduled: false },
);

const shareWishlistTask = cron.schedule(
  '0 0 * * * *',
  sendShareWishlistPushes,
  { scheduled: false },
);

const friendEventTask = cron.schedule(
  '0 0 */4 * * *',
  sendFriendEventPushes,
  { scheduled: false },
);

const mostAddedTask = cron.schedule(
  '0 0 0 */3 * *',
  sendMostAddedPushes,
  { scheduled: false },
);

const checkTrendingTask = cron.schedule(
  '0 0 * * * *',
  sendCheckTrendingPushes,
  { scheduled: false },
);

const start = () => {
  // addFriendTask.start();
  // shareWishlistTask.start();
  // friendEventTask.start();
  // mostAddedTask.start();
  // checkTrendingTask.start();
};

module.exports = {
  start,
  sendFriendEventPushes,
  sendCheckTrendingPushes,
  sendMostAddedPushes,
  sendShareWishlistPushes,
  sendAddFriendsPushes,
};
