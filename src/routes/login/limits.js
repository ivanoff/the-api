const loginLimits = { minute: 30, hour: 60, day: 240 };

module.exports = {
  'POST /login': loginLimits,
  'POST /register': loginLimits,
  'POST /login/forgot': loginLimits,
};
