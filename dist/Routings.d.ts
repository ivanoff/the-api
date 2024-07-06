import type { CrudBuilderOptionsType, MiddlewareHandler, RoutesErrorsType, RoutesType, RoutingsOptionsType } from './types';
export declare class Routings {
    routes: RoutesType[];
    routesPermissions: any;
    routesErrors: RoutesErrorsType;
    migrationDirs: string[] | unknown;
    constructor(options?: RoutingsOptionsType);
    private pushToRoutes;
    get(path: string, ...fnArr: MiddlewareHandler[]): void;
    post(path: string, ...fnArr: MiddlewareHandler[]): void;
    patch(path: string, ...fnArr: MiddlewareHandler[]): void;
    put(path: string, ...fnArr: MiddlewareHandler[]): void;
    delete(path: string, ...fnArr: MiddlewareHandler[]): void;
    use(path: string, ...fnArr: MiddlewareHandler[]): void;
    crud(params: CrudBuilderOptionsType): void;
    errors(err: RoutesErrorsType | RoutesErrorsType[]): void;
}
//# sourceMappingURL=Routings.d.ts.map