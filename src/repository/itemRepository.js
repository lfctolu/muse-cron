const { sequelize } = require('../config/db');
const { QueryTypes } = require('sequelize');

const getAllMostAdded = async (from, page, size) => {
  const offset = (page - 1) * size;
  return sequelize.query(
    `SELECT i.id, i.name
     FROM items i
              JOIN (SELECT i.refId, count(*) AS cnt
                    FROM items i
                    WHERE i.wishlistId IS NOT NULL
                      AND i.refId IS NOT NULL
                      AND i.createdAt >= :from
                    GROUP BY i.refId) AS ref ON i.id = ref.refId
              LEFT JOIN wishlists w ON i.wishlistId = w.id
     WHERE (w.privacySetting = 0 OR w.id IS NULL)
       AND i.isArchived = 0
     ORDER BY ref.cnt DESC
     LIMIT :limit OFFSET :offset`,
    {
      replacements: { from, limit: size, offset },
      type: QueryTypes.SELECT,
      raw: true,
    },
  );
};

const countRefs = async (itemId, from) => {
  const count = await sequelize.query(
    `SELECT count(*) AS cnt
     FROM items i
     WHERE i.refId = :itemId
       AND i.wishlistId IS NOT NULL
       AND i.createdAt >= :from`,
    {
      replacements: { itemId, from },
      type: QueryTypes.SELECT,
      raw: true,
      plain: true,
    },
  );

  return count?.cnt || 0;
};

module.exports = {
  getAllMostAdded,
  countRefs,
};
