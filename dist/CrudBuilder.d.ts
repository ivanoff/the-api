import type { CrudBuilderOptionsType, CrudBuilderPermissionsType, DbTablesType, MethodsType, getResultType, stringRecordType } from "./types";
import type { Context } from 'hono';
import type { Knex } from 'knex';
export default class CrudBuilder {
    c?: Context;
    table: any;
    schema: any;
    aliases: stringRecordType;
    join: any;
    joinOnDemand: any;
    leftJoin: any;
    leftJoinDistinct: any;
    lang: any;
    translate: any;
    searchFields: any;
    requiredFields: any;
    defaultWhere: any;
    defaultWhereRaw: any;
    defaultSort: any;
    sortRaw: any;
    fieldsRaw: any;
    tokenRequired: any;
    ownerRequired: any;
    rootRequired: any;
    access: any;
    accessByStatuses: any;
    deletedReplacements: any;
    includeDeleted: boolean;
    hiddenFields?: string[];
    readOnlyFields?: string[];
    permissionViewableFields?: Record<string, string[]>;
    permissionEditableFields?: Record<string, string[]>;
    showFieldsByPermission?: Record<string, string[]>;
    permissionCheckedMethods?: (MethodsType | '*')[];
    replacedOwnerPermissions?: string[];
    cache: any;
    userIdFieldName: any;
    additionalFields: any;
    apiClientMethodNames: any;
    dbTables: DbTablesType;
    coaliseWhere: any;
    langJoin: any;
    coaliseWhereReplacements: any;
    user?: any;
    res: any;
    isOwner?: boolean;
    rows: any;
    relations?: Record<string, CrudBuilderOptionsType>;
    roles: any;
    permissions?: CrudBuilderPermissionsType;
    ownerPermissions: Record<string, boolean>;
    constructor({ c, table, schema, aliases, join, joinOnDemand, leftJoin, leftJoinDistinct, lang, translate, searchFields, hiddenFields, readOnlyFields, permissions, requiredFields, defaultWhere, defaultWhereRaw, defaultSort, sortRaw, fieldsRaw, tokenRequired, ownerRequired, rootRequired, access, accessByStatuses, dbTables, deletedReplacements, includeDeleted, cache, userIdFieldName, additionalFields, apiClientMethodNames, relations, }: CrudBuilderOptionsType);
    getDbWithSchema(db: Knex<any, unknown[]>): Knex.QueryBuilder<any, {
        _base: any;
        _hasSelection: false;
        _keys: never;
        _aliases: {};
        _single: false;
        _intersectProps: {};
        _unionProps: never;
    }[]>;
    getTableRows(c: Context): any;
    sort(sort: any, db: any): void;
    pagination({ _page, _skip, _limit, _unlimited, }: any): void;
    whereNotIn(whereNotInObj: any): void;
    where(whereObj: any, db: any): void;
    getHiddenFields(): {
        regular: string[];
        owner: string[];
    };
    fields({ c, _fields, _join, db, _sort, }: any): void;
    checkDeleted(): void;
    getJoinFields(): any;
    deleteHiddenFieldsFromResult(result: any, hiddenFields: any): void;
    /** return data from table. Use '_fields', '_sort', '_start', '_limit' options
     * examples:
     * - second page, 1 record per page, sort by title desc, only id and title fields:
     *   /ships?_fields=id,title&_sort=-title&_page=2&_limit=1
     * - skip 100 records, get next 10 records: /ships?_skip=100&_limit=10
     * - search by id and title: /ships?_fields=title&id=2&title=second data
     * - search by multiply ids: /ships?_fields=id&id=1&id=3
     * - search where not: /ships?_fields=title&title!=_e%25 d_ta
     * - search by 'like' mask: /ships?_fields=title&title~=_e%25 d_ta
     * - search from-to: /ships?_from_year=2010&_to_year=2020
     */
    optionsGet(): {
        tokenRequired: any;
        ownerRequired: any;
        rootRequired: any;
        joinFields: any;
        cache: any;
        joinOnDemand: any;
        accessByStatuses: any;
        additionalFields: any;
        queryParameters: any;
        apiClientMethodNames: any;
    };
    get(c: Context): Promise<void>;
    getRequestResult(c: Context, q?: Record<string, string[]>): Promise<getResultType>;
    optionsGetById(): {
        tokenRequired: any;
        ownerRequired: any;
        rootRequired: any;
        joinFields: any;
        joinOnDemand: any;
        accessByStatuses: any;
        additionalFields: any;
        cache: any;
        apiClientMethodNames: any;
    };
    getById(c: Context): Promise<void>;
    updateIncomingData(c: Context, data: any): any;
    updateData(c: Context, data: any): any;
    optionsAdd(): {
        tokenRequired: any;
        ownerRequired: any;
        rootRequired: any;
        readOnlyFields: string[];
        requiredFields: string[];
        accessByStatuses: any;
        apiClientMethodNames: any;
        schema: any;
    };
    add(c: Context): Promise<void>;
    optionsUpdate(): {
        tokenRequired: any;
        ownerRequired: any;
        rootRequired: any;
        readOnlyFields: string[];
        accessByStatuses: any;
        additionalFields: any;
        apiClientMethodNames: any;
        schema: any;
    };
    update(c: Context): Promise<void>;
    optionsDelete(): {
        tokenRequired: any;
        ownerRequired: any;
        rootRequired: any;
        accessByStatuses: any;
        apiClientMethodNames: any;
    };
    delete(c: Context): Promise<void>;
}
//# sourceMappingURL=CrudBuilder.d.ts.map