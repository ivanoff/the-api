const loginLimits = { minute: 30, hour: 60, day: 240 };

export default {
  'POST /login': loginLimits,
  'POST /register': loginLimits,
  'POST /login/forgot': loginLimits,
};
