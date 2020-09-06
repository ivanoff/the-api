module.exports = {

  NO_TOKEN: {
    code: 101,
    status: 401,
    name: 'No token',
    description: 'User token not found. Please send TOKEN_IN_HEADER with valid token',
  },

  TOKEN_EXPIRED: {
    code: 103,
    status: 403,
    name: 'Token expired',
    description: 'Token has been expired. Please get valid token from /login',
  },

  TOKEN_INVALID: {
    code: 102,
    status: 403,
    name: 'Token is invalid',
    description: 'User token is invalid. Please get valid token from /login',
  },

};
