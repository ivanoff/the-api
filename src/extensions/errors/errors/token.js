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

  STATUS_INVALID: {
    code: 104,
    status: 403,
    name: 'Status is invalid',
    description: 'User status is invalid',
  },

  USER_ACCESS_DENIED: {
    code: 105,
    status: 403,
    name: 'User access denied',
    description: 'User status was not found in user access table',
  },

  FORBIDDEN_STATUS_NAME: {
    code: 106,
    status: 403,
    name: 'Status name is forbidden',
    description: 'Status name is forbidden. Please use another status name',
  },
};
