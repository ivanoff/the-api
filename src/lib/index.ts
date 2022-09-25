import * as checkAccess from './check_access';
import crud from './crud';
import getCode from './code';
import getSwaggerData from './swagger';
import getTablesInfo from './tables_info';
import KoaKnexHelper from './koa_knex_helper';
import Mail from './mail';
import relations from './relations';
import Router from './router';

const sleep = (ms) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

export { checkAccess, crud, getCode, getSwaggerData, getTablesInfo, KoaKnexHelper, Mail, relations, Router, sleep };
