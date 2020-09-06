module.exports = {

  DEFAULT_ERROR: {
    code: 10,
    status: 500,
    name: 'Something goes wrong',
    description: 'This is default error. We already know about it and make etherything posible to resolve it.',
  },

  API_METHOD_NOT_FOUND: {
    code: 100,
    status: 404,
    name: 'API method not found',
    description: 'This method is not in API. For available methods use GET /info',
  },

  NOT_FOUND: {
    code: 101,
    status: 404,
    name: 'Not found',
    description: 'API returns empty result',
  },

  NOT_IN_WHITE_LIST: {
    code: 121,
    status: 403,
    name: 'Limit is exceeded (token is not in whitelist)',
    description: 'Your limit was exceeded and user token was removed from whitelist. Please ask admins to incrase limits',
  },

  LIMIT_EXCEEDED: {
    code: 122,
    status: 403,
    name: 'Limit is exceeded',
    description: 'Your limit is exceeded. Please ask admins to incrase limits',
  },

};
