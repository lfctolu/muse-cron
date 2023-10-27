module.exports = {
  getTotalPages: (count, pageSize) => (count - 1) / pageSize + 1,
};
