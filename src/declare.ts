export type VeType = {
    props?: {
        key: string;
        viewText?: string;
        type: VeType;
    }[];
    args?: {
        key: string;
        type: VeType;
        value?: any;
    }[];
    returnType?: VeType;
    unionType?: VeType;
    generics?: VeType[];
    types?: VeType[];
} | string;

export type Route = {
    url: string,
    viewFilePath: string,
    controllerFilePath: string,
    serviceFilePath?: string,
    method?: 'all' | 'get' | 'post',
    roles?: string[],
    args: { key: string, type: VeType, value: any }[];
    returnType?: VeType;
    mine: 'view' | 'api' | 'view-api' | 'file' | 'image'
}


export type Config = {
    upload_dir: string,
    roles: { text: string, type: 'default' | 'user' }[],
    defaultPage: string,
    errorPage: string,
    noPermissionPage: string,
    notFoundPage: string,
    error(...errors: (string | Error)[]);
    monitor(...args:any[]);
    root: string,
    role_session_key?: string
};

/****定义一些错误异常类型 */
export enum HandleExceptionType {
    /****服务器出错 */
    serviceError = 500,
    /****页面不存在 */
    pageNotFound = 404,
    /****无权限 */
    unauthorizedAccess = 405
};