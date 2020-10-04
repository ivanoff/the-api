const loginLimits = { minute: 3, hour: 6, day: 24 };

module.exports = {
  'POST /login': loginLimits,
  'POST /register': loginLimits,
  'POST /login/forgot': loginLimits,
};
