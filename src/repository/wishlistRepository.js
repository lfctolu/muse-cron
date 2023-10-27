const { QueryTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const getAllForPushShare = async ({ from, to, limit, offset, transaction }) => sequelize.query(
  `SELECT w.id, w.name, w.userId
   FROM wishlists w
            JOIN items i ON w.id = i.wishlistId
   WHERE w.privacySetting = 0
   GROUP BY w.id
   HAVING min(i.createdAt) BETWEEN :from AND :to
   ORDER BY w.id
   LIMIT :limit OFFSET :offset`,
  {
    replacements: { from, to, limit, offset },
    type: QueryTypes.SELECT,
    raw: true,
    transaction,
  },
);

const countForPushShare = async (from, to) => {
  const result = await sequelize.query(
    `SELECT count(*) AS cnt
     FROM (SELECT w.id
           FROM wishlists w
                    JOIN items i ON w.id = i.wishlistId
           WHERE w.privacySetting = 0
           GROUP BY w.id
           HAVING min(i.createdAt) BETWEEN :from AND :to) AS res`,
    {
      replacements: { from, to },
      type: QueryTypes.SELECT,
      raw: true,
      plain: true,
    },
  );

  return result?.cnt;
};

const getAllForPushEvent = async ({ from, to, limit, offset, transaction }) => sequelize.query(
  `SELECT w.id, w.userId
   FROM wishlists w
   WHERE w.relevantDate > :from
     AND w.relevantDate <= :to
   ORDER BY w.id
   LIMIT :limit OFFSET :offset`,
  {
    replacements: { from, to, limit, offset },
    type: QueryTypes.SELECT,
    raw: true,
    transaction,
  },
);

const countForPushEvent = async (from, to) => {
  const result = await sequelize.query(
    `SELECT count(*) AS cnt
     FROM wishlists w
     WHERE w.relevantDate > :from
       AND w.relevantDate <= :to`,
    {
      replacements: { from, to },
      type: QueryTypes.SELECT,
      raw: true,
      plain: true,
    },
  );

  return result?.cnt;
};

module.exports = {
  getAllForPushShare,
  countForPushShare,
  getAllForPushEvent,
  countForPushEvent,
};
