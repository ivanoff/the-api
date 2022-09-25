"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = (db) => __awaiter(void 0, void 0, void 0, function* () {
    let query;
    let bindings = [db.client.database()];
    switch (db.client.constructor.name) {
        case 'Client_MSSQL':
            query = 'SELECT table_name FROM information_schema.tables WHERE table_schema = \'public\' AND table_catalog = ?';
            break;
        case 'Client_MySQL':
        case 'Client_MySQL2':
            query = 'SELECT table_name FROM information_schema.tables WHERE table_schema = ?';
            break;
        case 'Client_Oracle':
        case 'Client_Oracledb':
            query = 'SELECT table_name FROM user_tables';
            bindings = undefined;
            break;
        case 'Client_PG':
            query = 'SELECT table_name FROM information_schema.tables WHERE table_schema = current_schema()';
            bindings = undefined;
            break;
        case 'Client_SQLite3':
            query = `SELECT name AS table_name FROM sqlite_master WHERE type='table'`;
            bindings = undefined;
            break;
        default:
            throw new Error('Unknown database');
    }
    const t = yield db.raw(query, bindings);
    const tables = t.rows || t;
    let queryRef;
    switch (db.client.constructor.name) {
        case 'Client_MSSQL':
        case 'Client_MySQL':
        case 'Client_MySQL2':
        case 'Client_Oracle':
        case 'Client_Oracledb':
        case 'Client_SQLite3':
            queryRef = '';
            break;
        case 'Client_PG':
            queryRef = `SELECT
              tc.table_schema, 
              tc.constraint_name, 
              tc.table_name, 
              kcu.column_name, 
              ccu.table_schema AS foreign_table_schema,
              ccu.table_name AS foreign_table_name,
              ccu.column_name AS foreign_column_name 
          FROM 
              information_schema.table_constraints AS tc 
              JOIN information_schema.key_column_usage AS kcu
                ON tc.constraint_name = kcu.constraint_name
                AND tc.table_schema = kcu.table_schema
              JOIN information_schema.constraint_column_usage AS ccu
                ON ccu.constraint_name = tc.constraint_name
                AND ccu.table_schema = tc.table_schema
          WHERE tc.constraint_type = 'FOREIGN KEY'`;
            break;
        default:
            throw new Error('Unknown database');
    }
    let references = [];
    if (queryRef) {
        const tRef = yield db.raw(queryRef, bindings);
        references = tRef.rows || tRef;
    }
    const result = {};
    yield Promise.all(tables.map(({ table_name }) => __awaiter(void 0, void 0, void 0, function* () {
        if (db.client.constructor.name === 'Client_PG') {
            const columnInfo = yield db.raw('select * from information_schema.columns where table_name = ? and table_schema = current_schema()', table_name);
            result[`${table_name}`] = columnInfo.rows.reduce((acc, cur) => (Object.assign(Object.assign({}, acc), { [cur.column_name]: cur })), {});
            for (const key of Object.keys(result[`${table_name}`])) {
                result[`${table_name}`][`${key}`].references = references.find((item) => item.table_name === table_name && item.column_name === key);
            }
        }
        else {
            result[`${table_name}`] = yield db(table_name).columnInfo();
        }
    })));
    return result;
});
