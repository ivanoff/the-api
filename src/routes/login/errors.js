module.exports = {

  USER_NOT_FOUND: {
    code: 1030,
    status: 404,
    name: 'User Not Found',
    description: 'User not found. Please send correct login and password',
  },

  EMAIL_NOT_CONFIRMED: {
    code: 1031,
    status: 401,
    name: 'Email Not Confirmed',
    description: 'Email not confirmed. Please, check your incoming mail folder for confirm link',
  },

  LOGIN_EXISTS: {
    code: 1032,
    status: 409,
    name: 'Login exists',
    description: 'Login exists. Please enter another login',
  },

  EMAIL_EXISTS: {
    code: 1033,
    status: 409,
    name: 'Email exists',
    description: 'Email exists in database. Please enter another email',
  },

  WRONG_CODE: {
    code: 1034,
    status: 409,
    name: 'Wrong Code',
    description: 'Code you provide was wrong. Please try with another one or reset you password',
  },

  LOGIN_REQUIRED: {
    code: 1035,
    status: 409,
    name: 'Login required',
    description: 'Login required. Please enter login',
  },

  WRONG_PASSWORD: {
    code: 1036,
    status: 401,
    name: 'Wrong password',
    description: 'Password is wrong. Please check it or restore your password',
  },

  SUPERADMIN_REQUIRED: {
    code: 1037,
    status: 409,
    name: 'Login required',
    description: 'Superadmin Login required',
  },

  OAUTH2_CLIENT_NOT_FOUND: {
    code: 1040,
    status: 404,
    name: 'Client not found',
  },

  OAUTH2_APPLICATION_NOT_FOUND: {
    code: 1041,
    status: 404,
    name: 'Application not found',
  },

  OAUTH2_INVALID_CLIENT_ID: {
    code: 1042,
    status: 404,
    name: 'Client Id is required',
  },

  OAUTH2_INVALID_REDIRECT_URI: {
    code: 1043,
    status: 409,
    name: 'Redirect URI not found',
  },

  OAUTH2_INVALID_SCOPE: {
    code: 1044,
    status: 409,
    name: 'Invalid scope',
  },

  OAUTH2_INVALID_TOKEN: {
    code: 1045,
    status: 409,
    name: 'Invalid token',
  },

  OAUTH2_CODE_REQUIRED: {
    code: 1047,
    status: 409,
    name: 'Code required',
  },

  OAUTH2_NAME_EXISTS: {
    code: 1048,
    status: 409,
    name: 'Name already exists',
  },

  OAUTH2_GET_TOKEN_ERROR: {
    code: 1049,
    status: 409,
    name: 'Getting token error',
  },
};
