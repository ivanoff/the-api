import type { Context, MiddlewareHandler, Handler } from 'hono';
import type { H } from 'hono/types';
import type { Routings } from './Routings';
import type { Roles } from 'the-api-roles';

export type { MiddlewareHandler, Handler };

export type MethodsType = ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'][number];

export type MethodPathType = {
    method?: MethodsType;
    path: string;
};

export type RoutesType = MethodPathType & {
    handlers: (Handler | MiddlewareHandler)[];
};

export type PushToRoutesParamsType = MethodPathType & {
    fnArr: H<any, any, {}, any>[];
};

export type RoutesErrorsType = {
    [key: string]: {
        code: number,
        status: number,
        description?: string,
    }    
};

export type TheApiOptionsType = {
    routings: Routings[];
    roles?: Roles;
    port?: number;
    migrationDirs?: string[];
};

export type DbOptionsType = {
    migrationDirs?: string[];
};

export type RoutingsOptionsType = {
    migrationDirs?: string[];
};

export type DbTablesType = {
    data_type: string;
    is_nullable: string;
    [key: string]: any;
};

export type stringRecordType = Record<string, string>;

export type fieldRecordType = Record<string, fieldType>;

export type whereParamsType = stringRecordType & { isDeleted?: boolean };

export type fieldType = string | number | boolean;

export type CrudBuilderJoinType = {
    table: string;
    schema?: string;
    alias?: string;
    as?: string;
    where?: string;
    whereBindings?: stringRecordType;
    defaultValue?: fieldType;
    fields?: string[];
    field?: string;
    orderBy?: string;
    limit?: number;
    leftJoin?: string | string[];
    byIndex?: number;
    permission?: string;
};

export type CrudBuilderPermissionsType = {
    protectedMethods?: (MethodsType | '*')[];
    owner?:  string[];
    fields?: {
        viewable?: Record<string, string[]>;
        editable?: Record<string, string[]>;
    };
};

export type CrudBuilderOptionsType = {
    c?: Context;
    table: string;
    prefix?: string;
    schema?: string;
    aliases?: stringRecordType;
    join?: CrudBuilderJoinType[];
    joinOnDemand?: CrudBuilderJoinType[];
    leftJoin?: string[];
    leftJoinDistinct?: string[];
    lang?: string;
    translate?: string[];
    searchFields?: string[];
    requiredFields?: string[];
    hiddenFields?: string[];
    readOnlyFields?: string[];
    showFieldsByPermission?: Record<string, string[]>;
    permissions?: CrudBuilderPermissionsType;

    defaultWhere?: fieldRecordType;
    defaultWhereRaw?: string;
    defaultSort?: string;
    sortRaw?: string;
    fieldsRaw?: any;
    includeDeleted?: boolean;
    deletedReplacements?: fieldRecordType;
    relations?: Record<string, CrudBuilderOptionsType>;
    relationIdName?: string;

    tokenRequired?: any;
    ownerRequired?: any;
    rootRequired?: any;
    access?: any;
    accessByStatuses?: any;
    dbTables?: any;
    cache?: any;
    userIdFieldName?: any;
    additionalFields?: any;
    apiClientMethodNames?: any;
};

export type metaType = {
    total: number;
    limit?: number;
    skip?: number;
    page?: number;
    nextPage?: number;
    pages?: number;
    after?: string;
    nextAfter?: string;
    isFirstPage?: boolean;
    isLastPage?: boolean;
};

export type getResultType = {
    result: any[];
    meta: metaType;
    relations?: Record<string, any[]>;
    error?: boolean;
}
