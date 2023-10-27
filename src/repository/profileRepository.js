const { QueryTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const getAllForPushFriend = async ({ from, to, count, limit, offset, transaction }) =>
  sequelize.query(
    `SELECT utu.userId, p.username, p.playerID
     FROM usersToUsers utu
              JOIN profiles p ON utu.userId = p.id
     WHERE p.createdAt <= :to
       AND p.createdAt > :from
     GROUP BY utu.userId
     HAVING count(utu.friendId) < :count
     ORDER BY utu.userId LIMIT :limit
     OFFSET :offset`,
    {
      replacements: { from, to, count, limit, offset },
      type: QueryTypes.SELECT,
      raw: true,
      transaction,
    });

const countForPushFriend = async ({ from, to, count }) => {
  const result = await sequelize.query(
    `SELECT count(*) AS cnt
     FROM (SELECT utu.userId
           FROM usersToUsers utu
                    JOIN profiles p ON utu.userId = p.id
           WHERE p.createdAt <= :to
             AND p.createdAt > :from
           GROUP BY utu.userId
           HAVING count(utu.friendId) < :count) AS res`,
    {
      replacements: { from, to, count },
      type: QueryTypes.SELECT,
      raw: true,
      plain: true,
    });

  return result?.cnt || 0;
};

const countAllFriends = async (userIds) => {
  const ids = userIds?.length ? userIds : null;
  const result = await sequelize.query(
    `SELECT count(*) AS cnt
     FROM usersToUsers
     WHERE userId IN (:ids)`,
    {
      replacements: { ids },
      type: QueryTypes.SELECT,
      raw: true,
      plain: true,
    });

  return result?.cnt || 0;
};

const getFriendPlayerIds = async (usedIds, limit, offset) => {
  const ids = usedIds?.length ? usedIds : null;
  return sequelize.query(
    `SELECT userId, p.playerID
     FROM usersToUsers utu
              JOIN profiles p ON utu.friendId = p.id
     WHERE userId IN (:ids)
     ORDER BY userId, friendId LIMIT :limit
     OFFSET :offset`,
    {
      replacements: { ids, limit, offset },
      type: QueryTypes.SELECT,
      raw: true,
    });
};

const countForPushTrending = async (from, to) => {
  const result = await sequelize.query(
    `SELECT count(*) AS cnt
     FROM profiles p
              LEFT JOIN items i ON p.id = i.userId
     WHERE p.createdAt > :from
       AND p.createdAt <= :to
       AND i.id IS NULL`,
    {
      replacements: { from, to },
      type: QueryTypes.SELECT,
      raw: true,
      plain: true,
    });

  return result?.cnt || 0;
};

const getAllForPushTrending = ({ from, to, limit, offset, transaction }) =>
  sequelize.query(
    `SELECT p.id, p.playerID
     FROM profiles p
              LEFT JOIN items i ON p.id = i.userId
     WHERE p.createdAt BETWEEN :from AND :to
       AND i.id IS NULL
     ORDER BY p.id LIMIT :limit
     OFFSET :offset`,
    {
      replacements: { from, to, limit, offset },
      type: QueryTypes.SELECT,
      raw: true,
      transaction,
    });

const getFriendRoundUp = ({ userIds, from, to, limit, offset }) => {
  const ids = userIds?.length ? userIds : null;
  return sequelize.query(
    `SELECT utu.userId,
            p.name,
            p.lastName,
            json_arrayagg(json_object('name', w.name, 'date', w.relevantDate)) AS events,
            json_arrayagg(json_object('name', wi.name, 'count', wi.cnt))       AS wishlists
     FROM usersToUsers utu
              JOIN profiles p ON p.id = utu.friendId
              LEFT JOIN wishlists w
                        ON p.id = w.userId AND w.relevantDate BETWEEN CURRENT_DATE AND :to
              LEFT JOIN (SELECT w.id, w.name, w.userId, count(*) AS cnt
                         FROM items i
                                  JOIN wishlists w ON i.wishlistId = w.id
                         WHERE i.createdAt >= :from
                           AND i.wishlistId IS NOT NULL
                           AND i.userId IS NOT NULL
                           AND w.privacySetting != 2
                         GROUP BY i.wishlistId) AS wi ON p.id = wi.userId
     WHERE utu.userId IN (:ids)
       AND (w.id IS NOT NULL OR wi.id IS NOT NULL)
     GROUP BY utu.userId, p.id
     ORDER BY utu.userId, p.id LIMIT :limit
     OFFSET :offset`,
    {
      replacements: { ids, from, to, limit, offset },
      type: QueryTypes.SELECT,
      raw: true,
    });
};

const getIdsForRoundUp = async (limit, offset, transaction) => {
  const result = await sequelize.query(`
              SELECT p.id
              FROM profiles p
              ORDER BY p.id LIMIT :limit
              OFFSET :offset`,
    {
      replacements: { limit, offset },
      type: QueryTypes.SELECT,
      raw: true,
      transaction,
    });

  return result.map(({ id }) => id);
};

const count = async () => {
  const result = await sequelize.query(
    `SELECT count(*) AS cnt
     FROM profiles`,
    {
      type: QueryTypes.SELECT,
      raw: true,
      plain: true,
    });

  return result?.cnt || 0;
};

const getNamesAndEmails = async (userIds) => {
  const ids = userIds?.length ? userIds : null;
  const result = await sequelize.query(
    `SELECT id, email, name, lastName
     FROM profiles
     WHERE id IN (:ids)`,
    {
      replacements: { ids },
      type: QueryTypes.SELECT,
      raw: true,
    });

  return new Map(result.map(({ id, email, name, lastName }) => [id, { email, name, lastName }]));
};

const getPlayerIds = async (usedIds) => {
  const ids = usedIds?.length ? usedIds : null;
  const result = await sequelize.query(
    `SELECT p.id, p.playerID
     FROM profiles p
     WHERE p.id IN (:ids)`,
    {
      replacements: { ids },
      type: QueryTypes.SELECT,
      raw: true,
    });

  return new Map(result.map(({ id, playerID }) => [id, playerID]));
};

module.exports = {
  getAllForPushFriend,
  countForPushFriend,
  countAllFriends,
  getFriendPlayerIds,
  countForPushTrending,
  getAllForPushTrending,
  getFriendRoundUp,
  getIdsForRoundUp,
  count,
  getNamesAndEmails,
  getPlayerIds,
};
