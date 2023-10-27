module.exports = {
  expose: (req, res, next) => {
    res.header('Access-Control-Expose-Headers', 'x-total-count, content-disposition');
    next();
  },
  swagger: (req, res, next) => {
    res.header('Cache-Control', 'no-cache, no-store, max-age=0, must-revalidate');
    next();
  },
};
