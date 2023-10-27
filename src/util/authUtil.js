const { ForbiddenError } = require('../error/index');

module.exports = {
  validateRole: (user, role) => {
    if (user?.role !== role) {
      throw new ForbiddenError('Forbidden');
    }
  },
};
