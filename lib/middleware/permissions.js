const { UnauthorisedError } = require('@asl/service/errors');

module.exports = (...roles) => {
  roles = roles.map(role => `asru${role[0].toUpperCase()}${role.substring(1)}`);
  return (req, res, next) => {
    const allowed = roles.find(role => !!req.user.profile[role]);
    if (!allowed) {
      return next(new UnauthorisedError());
    }
    next();
  };
};
