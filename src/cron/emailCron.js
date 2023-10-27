const cron = require('node-cron');
const profileRepository = require('../repository/profileRepository');
const logger = require('../util/logger');
const dayjs = require('dayjs');
const { getTotalPages } = require('../util/pageUtil');
const asyncQueue = require('async/queue');
const sesClient = require('../config/ses');
const { SendEmailCommand } = require('@aws-sdk/client-sesv2');
const { generateRoundUp } = require('../util/emailUtil');

const SIZE = 100;
const DELAY = 70;

const sendRoundUpEmails = async () => {
  // check if it is 7pm PT, because cron uses utc timezone
  if (dayjs().tz('America/Los_Angeles').startOf('hour').hour() !== 19) {
    return;
  }

  const date = dayjs().startOf('hour');
  const from = date.subtract(7, 'day').unix();
  const to = date.add(14, 'day').unix();
  const count = await profileRepository.count();
  const pages = getTotalPages(count, SIZE);
  const queue = asyncQueue(async data => {
    await new Promise(resolve => setTimeout(resolve, DELAY));

    const text = generateRoundUp(data);
    const command = new SendEmailCommand({
      FromEmailAddress: process.env.FROM_EMAIL,
      Destination: { ToAddresses: ['anton.luhavy@yellow.systems'] },
      Content: {
        Simple: {
          Subject: { Data: 'Weekly Round-Up', Charset: 'UTF-8' },
          Body: { Html: { Data: text, Charset: 'UTF-8' } },
        },
      },
    });

    return sesClient.send(command);
  }, SIZE);
  queue.error((err, task) => logger.error(`Error on sending round-up email to ${task.id}`, err));

  for (let i = 0; i < pages; i++) {
    try {
      const data = await createFriendRoundUpDate(from, to, SIZE, SIZE * i);

      queue.push(data);
    } catch (err) {
      logger.error(`Error on creating round-up emails`, err);
    }
  }

  await queue.drain();
};

const createFriendRoundUpDate = async (from, to, limit, offset) => {
  const userIds = await profileRepository.getIdsForRoundUp(limit, offset);
  const userMap = await profileRepository.getNamesAndEmails(userIds);
  const map = new Map();
  let shift = 0;

  while (true) {
    const data = await profileRepository.getFriendRoundUp({
      userIds, from, to, limit: 500, offset: 500 * shift,
    });

    if (!data?.length) {
      break;
    }

    for (const item of data) {
      if (!map.has(item.userId)) {
        map.set(item.userId, []);
      }
      map.get(item.userId).push({
        events: item.events.filter(event => event.name)
          .map(event => `${getName(item)} has some items in '${event.name}' wishlist (${event.date})`),
        wishlists: item.wishlists.filter(wl => wl.name)
          .map(wl => `${getName(item)} added ${wl.count} items to '${wl.name}' wishlist. See them`),
      });
    }

    shift += 1;
  }

  return [...map.entries()].map(entry => ({ user: userMap.get(entry[0]), arr: entry[1] }));
};

const getName = (data) => `${data.name}${data.lastName ? ` ${data.lastName}` : ''}`;

const roundUpTask = cron.schedule(
  '0 0 2,3 * * 1',
  sendRoundUpEmails,
  { scheduled: false },
);

module.exports = {
  start: () => roundUpTask.start(),
  sendRoundUpEmails,
};
