export declare type VeType = {
    props?: {
        key: string;
        viewText?: string;
        type: VeType;
    }[];
    options?: {
        key: string;
        viewText?: string;
        value?: number | string;
    }[];
    args?: {
        key: string;
        viewText?: string;
        type: VeType;
        value?: any;
    }[];
    returnType?: VeType;
    returns?: {
        key: string;
        viewText?: string;
        type: VeType;
    }[];
    unionType?: VeType;
    generics?: VeType[];
    valueType?: {
        type: VeType;
        value: any;
    };
    types?: VeType[];
} | string;
export declare type Route = {
    url: string;
    viewFilePath: string;
    controllerFilePath: string;
    serviceFilePath?: string;
    method?: 'all' | 'get' | 'post';
    roles?: string[];
    args: {
        key: string;
        type: VeType;
        value: any;
    }[];
    returnType?: VeType;
    mine: 'view' | 'api' | 'view-api' | 'file' | 'image';
};
/****定义一些错误异常类型 */
export declare enum HandleExceptionType {
    /****服务器出错 */
    serviceError = 500,
    /****页面不存在 */
    pageNotFound = 404,
    /****无权限 */
    unauthorizedAccess = 405
}
export declare type HttpContext = {
    req: {
        url: string;
        session: Record<string, any>;
        files: {
            fieldname: string;
            path: string;
            originalname: string;
        }[];
        body: Record<string, any>;
        params: Record<string, any>;
        query: Record<string, any>;
    };
    res: {
        status: (code: number) => HttpContext['res'];
        send: (msg: string) => void;
        json: (data: Record<string, any>) => void;
        sendFile: (filePath: string) => void;
        redirect(code: number, url: string): void;
        headersSent: boolean;
    };
    next: () => void;
    callback?: (data: Record<string, any>) => void;
    error?: (errorMsg: Record<string, any>) => void;
    ViewBag?: Record<string, any>;
};
export declare type Config = {
    upload_dir: string;
    roles: {
        text: string;
        type: 'default' | 'user';
    }[];
    defaultPage: string;
    errorPage: string;
    noPermissionPage: string;
    notFoundPage: string;
    error(error: Error | any): any;
    root: string;
    role_session_key?: string;
};
export declare function PickParameterByRouteAndHttpContext(context: HttpContext, params: {
    key: string;
    type: string;
    value: any;
}[]): any[];
/****判断当前访问角色是否有权限访问 */
export declare function FilterRole(context: HttpContext, roles: string[]): boolean;
/****处理api服务 */
export declare function HandleService(context: HttpContext, serviceFilePath: string, args: any[], roles: string[]): void;
/***视图控制处理 */
export declare function HandleView(context: HttpContext, viewControllerFilePath: string, viewFilePath: string, args: any[], roles: string[]): void;
/****处理文件访问 */
export declare function HandleFile(context: HttpContext, staticFilePath?: string): void;
/***设置默认首页 */
export declare function HandleDefaultPage(context: HttpContext): void;
/***错误异常处理 */
export declare function HandleException(context: HttpContext, type: HandleExceptionType, ...args: any[]): void;
/***
 * @parmse router express 路由
 *
 */
export declare function use(router: any, routes: Route[], options: {
    upload_dir: string;
    roles: {
        text: string;
        type: 'default' | 'user';
    }[];
    defaultPage: string;
    errorPage: string;
    noPermissionPage: string;
    notFoundPage: string;
    error(error: Error | any): any;
    root: string;
    role_session_key?: string;
}): void;
export declare function config(options: {
    upload_dir: string;
    roles: {
        text: string;
        type: 'default' | 'user';
    }[];
    defaultPage: string;
    errorPage: string;
    noPermissionPage: string;
    notFoundPage: string;
    error(error: Error | any): any;
    root: string;
    role_session_key?: string;
}): void;
