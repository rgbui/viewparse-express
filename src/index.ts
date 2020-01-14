import { __ve_to_json, __ve_parse_json } from "./ve.data";

export type VeType = {
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

/****定义一些错误异常类型 */
export enum HandleExceptionType {
    /****服务器出错 */
    serviceError = 500,
    /****页面不存在 */
    pageNotFound = 404,
    /****无权限 */
    unauthorizedAccess = 405
};
export type HttpContext = {
    req: {
        url: string,
        session: Record<string, any>,
        files: { fieldname: string, path: string, originalname: string }[],
        body: Record<string, any>,
        params: Record<string, any>,
        query: Record<string, any>
    },
    res: {
        status: (code: number) => HttpContext['res'],
        send: (msg: string) => void,
        json: (data: Record<string, any>) => void,
        sendFile: (filePath: string) => void,
        redirect(code: number, url: string): void,
        headersSent: boolean
    },
    next:()=>void,
    callback?: (data: Record<string, any>) => void,
    error?: (errorMsg: Record<string, any>) => void,
    ViewBag?: Record<string, any>
}

export type Config = {
    upload_dir: string,
    roles: { text: string, type: 'default' | 'user' }[],
    defaultPage: string,
    errorPage: string,
    noPermissionPage: string,
    notFoundPage: string,
    error(error: Error | any);
    root: string,
    role_session_key?: string
};
var cfg: Config;
const fs = require('fs');
const fss = require('fs-sync');
var path = require('path');
function findFilePath(filePath: string) {
    if (filePath.startsWith('/') || filePath.startsWith('\\')) filePath = path.join(cfg.root, filePath.substring(1));
    else {
        if (!fs.existsSync(filePath)) filePath = path.join(cfg.root, filePath);
    }
    return filePath;
}
/*
 * 
 * 通过请求管道(context)和路由(route)来获取处理handle所需的参数
 * 来源于
 * @request.post,
 * @request.get,
 * @request.params
 * @request.files 如果检测到文件类型，则采集文件路径
 * 如果路由参数为特殊类型，则需要将类型转成nodejs对应ve
 * 
 */
export function PickParameterByRouteAndHttpContext(context: HttpContext,
    params: { key: string, type: string, value: any }[]) {
    var args: (any | { __ve_type: string, value: any })[] = [];
    let props = params;
    let getValue = (key) => {
        var ke = global.decodeURI(key);
        if (typeof context.req.body != 'undefined') {
            if (typeof context.req.body[key] != 'undefined')
                return context.req.body[key];
            if (typeof context.req.body[ke] != 'undefined')
                return context.req.body[ke];
        }
        if (typeof context.req.params != 'undefined') {
            if (typeof context.req.params[key] != 'undefined')
                return context.req.params[key];
            if (typeof context.req.params[ke] != 'undefined')
                return context.req.params[ke];
        }
        if (typeof context.req.query != 'undefined') {
            if (typeof context.req.query[key] != 'undefined')
                return context.req.query[key];
            if (typeof context.req.query[ke] != 'undefined')
                return context.req.query[ke];
        }
    }
    if (Array.isArray(props)) {
        props.forEach(prop => {
            let key = prop.key || (prop as any).text;
            switch (prop.type.toLowerCase()) {
                case 'image':
                case 'file':
                    if (Array.isArray(context.req.files)) {
                        var file = context.req.files.filter(x => x.fieldname == key || global.decodeURI(x.fieldname) == key)[0];
                        if (file) {
                            if (file.originalname && file.originalname.indexOf('.') > -1) {
                                var newFilePath = file.path + file.originalname.substring(file.originalname.indexOf('.'));
                                fs.renameSync(file.path, newFilePath);
                                file.path = newFilePath;
                            }
                            var cfgUploadDir = cfg.root + cfg.upload_dir;
                            if (!file.path.startsWith(cfgUploadDir)) {
                                //上传的文件路径与配置的路径不相符，那么有可能是服务器上面的部署的原型，此时需要转移一下
                                if (!fss.exists(cfgUploadDir)) fss.mkdir(cfgUploadDir);
                                newFilePath = path.join(cfgUploadDir, file.path.substring(file.path.lastIndexOf('\\') + 1));
                                fs.renameSync(file.path, newFilePath);
                                file.path = newFilePath;
                            }
                            args.push({ __ve_type: 'file', value: file.path });
                            return;
                        }
                    }
                    /***没有找到相应的文件 */
                    break;
                case 'int':
                case 'number':
                    var value = getValue(key);
                    if (prop.type == 'int') {
                        var v = parseInt(value);
                        if (isNaN(v)) {
                            if (typeof prop.value == 'number') return args.push(prop.value)
                        }
                        else return args.push(v)
                    }
                    else if (prop.type == 'number') {
                        var v = parseFloat(value);
                        if (isNaN(v)) {
                            if (typeof prop.value == 'number') return args.push(prop.value)
                        }
                        else return args.push(v)
                    }
                    break;
                case 'any':
                    var value = getValue(key);
                    if (typeof value != 'undefined') return args.push(value)
                    else if (typeof prop.value != 'undefined') return args.push(prop.value)
                    break;
                case 'string':
                    var value = getValue(key);
                    if (typeof value == 'string') return args.push(value)
                    else if (typeof prop.value == 'string') return args.push(prop.value)
                    break;
                case 'bool':
                    var value = getValue(key);
                    if (typeof value == 'string') {
                        if (value == 'true' || value == '是' || value == '真') return args.push(true)
                        else if (value == 'false' || value == '否' || value == '假') return args.push(false)
                    }
                    else if (typeof prop.value == 'boolean') return args.push(prop.value);
                    break;
                case 'date':
                    var value = getValue(key);
                    if (typeof value == 'string') {
                        try {
                            if (/^[\d]+$/.test(value)) return args.push(new Date(parseInt(value)));
                            else return args.push(new Date((value)));
                        }
                        catch (e) {

                        }
                    }
                    else if (prop.value instanceof Date) return args.push(prop.value);
                    break;
                case 'object':
                case 'array':
                    var value = getValue(key);
                    if (typeof value == 'string') {
                        try {
                            var data = JSON.parse(value);
                            data = __ve_parse_json(data);
                            if (prop.type == 'array' && Array.isArray(data)) return args.push(data)
                            else return args.push(data);
                        }
                        catch (e) {

                        }
                    }
                    else if (prop.type == 'array' && Array.isArray(prop.value)) return args.push(prop.value)
                    else if (prop.type == 'object' && typeof prop.value == 'object') return args.push(prop.value)
                    break;
                default:
                    if (typeof value == 'string') {
                        return args.push({ __ve_type: prop.type, value });
                    }
                    break;
            }
            args.push(undefined);
        })
    }
    return args;
}
/****判断当前访问角色是否有权限访问 */
export function FilterRole(context: HttpContext, roles: string[]): boolean {
    var isAllowed: boolean = true;
    var role = context.req.session[cfg.role_session_key];
    var rs = cfg.roles || [];
    /***如果当前的访问者没有，那么设为匿名默认 */
    if (!role) {
        var sr = rs.find(x => x.type == 'default');
        if (sr) role = sr.text;
    }
    if (Array.isArray(roles) && roles.length > 0) {
        isAllowed = roles.some(x => x == role);
    }
    if (isAllowed == false) {
        HandleException(context, HandleExceptionType.unauthorizedAccess, 'access forbidden...');
    }
    return isAllowed;
}
/****处理api服务 */
export function HandleService(context: HttpContext, serviceFilePath: string, args: any[], roles: string[]) {
    if (Array.isArray(roles) && roles.length > 0 && (FilterRole(context, roles) == false)) return;
    serviceFilePath = findFilePath(serviceFilePath);
    if (!fs.existsSync(serviceFilePath)) return HandleException(context, HandleExceptionType.pageNotFound, `not found server handle js file:${serviceFilePath}`)
    var handlerFx = require(serviceFilePath);
    if (typeof handlerFx == 'function') {
        try {
            context.callback = (data) => {
                data = __ve_to_json(data);
                context.res.status(200).json(data || {});
            }
            context.error = (error) => {
                HandleException(context, HandleExceptionType.serviceError, error);
            }
            handlerFx.apply(context, [context, ...args]);
        }
        catch (e) {
            HandleException(context, HandleExceptionType.serviceError, { error: e, msg: `the service file:${serviceFilePath} handling happend error` });
        }
    }
    else return HandleException(context, HandleExceptionType.pageNotFound, `the service file:${serviceFilePath} is not function `)
}
/***视图控制处理 */
export function HandleView(context: HttpContext, viewControllerFilePath: string, viewFilePath: string, args: any[], roles: string[]) {
    if (Array.isArray(roles) && roles.length > 0 && (FilterRole(context, roles) == false)) return;
    viewControllerFilePath = findFilePath(viewControllerFilePath);
    viewFilePath = findFilePath(viewFilePath);
    if (!fs.existsSync(viewControllerFilePath)) return HandleException(context, HandleExceptionType.serviceError, `not found view controller handle js file:${viewControllerFilePath}`);
    if (!fs.existsSync(viewFilePath)) return HandleException(context, HandleExceptionType.serviceError, `not found view  file:${viewControllerFilePath}`)
    var handlerFx = require(viewControllerFilePath);
    if (typeof handlerFx == 'function') {
        try {
            context.ViewBag = {};
            context.callback = (data) => {
                var ejs = require('ejs');
                context.ViewBag = __ve_to_json(context.ViewBag);
                ejs.renderFile(viewFilePath, {
                    ViewBag: context.ViewBag,
                    Config: {
                        ...cfg
                    },
                    httpContext: context
                },
                    { cache: false }, (err, html) => {
                        if (err) HandleException(context, HandleExceptionType.serviceError, { msg: `render view file:${viewFilePath} is error.`, err });
                        else context.res.status(200).send(html);
                    });
            }
            context.error = (error) => {
                HandleException(context, HandleExceptionType.serviceError, error);
            }
            handlerFx.apply(context, [context, ...args]);
        }
        catch (e) {
            HandleException(context, HandleExceptionType.serviceError, { error: e, msg: `the service file:${viewControllerFilePath} handling happend error` });
        }
    }
    else return HandleException(context, HandleExceptionType.pageNotFound, `the view controller file:${viewControllerFilePath} is not function `)
}
/****处理文件访问 */
export function HandleFile(context: HttpContext, staticFilePath?: string) {
    if (typeof staticFilePath == 'undefined') {
        var url = context.req.url;
        if (url.indexOf('?') > -1) url = url.substring(0, url.indexOf('?'));
        url = decodeURI(url);
        staticFilePath = (cfg.root + url).replace(/\//g, "\\");
    }
    if (fs.existsSync(staticFilePath)) return context.res.sendFile(staticFilePath);
    else HandleException(context, HandleExceptionType.serviceError, `not found file:${staticFilePath}`)
}
/***设置默认首页 */
export function HandleDefaultPage(context: HttpContext) {
    if (cfg && cfg.defaultPage) return context.res.redirect(302, global.encodeURI(cfg.defaultPage));
    HandleException(context, HandleExceptionType.pageNotFound);
}
/***错误异常处理 */
export function HandleException(context: HttpContext, type: HandleExceptionType, ...args: any[]) {
    if (context.res.headersSent == true) return;
    switch (type) {
        case HandleExceptionType.serviceError:
            /***日志记录 */
            cfg.error(args);
            if (cfg && cfg.errorPage) return context.res.redirect(302, global.encodeURI(cfg.errorPage));
            context.res.status(500).send('server happend error...');
            break;
        case HandleExceptionType.unauthorizedAccess:
            if (cfg && cfg.noPermissionPage) return context.res.redirect(302, global.encodeURI(cfg.noPermissionPage));
            context.res.status(404).send('not found page ...');
            break;
        case HandleExceptionType.pageNotFound:
            if (cfg && cfg.notFoundPage) return context.res.redirect(302, global.encodeURI(cfg.notFoundPage));
            context.res.status(404).send('not found page ...');
            break;
    }
}





/***
 * @parmse router express 路由
 * 
 */
export function use(router, routes: Route[], options: {

    upload_dir: string,
    roles: { text: string, type: 'default' | 'user' }[],
    defaultPage: string,
    errorPage: string,
    noPermissionPage: string,
    notFoundPage: string,
    error(error: Error | any);
    root: string,
    role_session_key?: string
}) {
    cfg = options;
    if (typeof cfg.role_session_key == 'undefined') cfg.role_session_key = '__role';
    routes.forEach(route => {
        (function (route) {

            let handler = (req, res, next) => {
                var args = PickParameterByRouteAndHttpContext({
                    res,
                    req,
                    next
                }, route.args as any);
                if (route.mine == 'view' || route.mine == 'view-api' || (route.mine as any) == 'viewApi') {
                    HandleView({
                        res,
                        req,
                        next
                    }, route.controllerFilePath, route.viewFilePath, args, route.roles);
                }
                else {
                    HandleService({
                        res,
                        req,
                        next
                    }, route.serviceFilePath, args, route.roles);
                }
            }
            if (route.mine == 'file' || route.mine == 'image') {
                handler = (req, res, next) => HandleFile({
                    res,
                    req,
                    next
                })
                router.get(route.url, handler);
                if (global.encodeURI(route.url) != route.url) router.get(global.encodeURI(route.url), handler);
            }
            else if (route.method == 'all' || !route.method) {
                router.all(route.url, handler);
                if (global.encodeURI(route.url) != route.url) router.all(global.encodeURI(route.url), handler);
            }
            else if (route.method == 'post') {
                router.post(route.url, handler);
                if (global.encodeURI(route.url) != route.url) router.post(global.encodeURI(route.url), handler);
            }
            else if (route.method == 'get') {
                router.get(route.url, handler);
                if (global.encodeURI(route.url) != route.url) router.get(global.encodeURI(route.url), handler);
            }
        })(route);
    });
    /****设置默认首页 */
    router.all('/', (req, res, next) => {
        HandleDefaultPage({
            req,
            res,
            next
        });
    });
}
export function config(options: {
    upload_dir: string,
    roles: { text: string, type: 'default' | 'user' }[],
    defaultPage: string,
    errorPage: string,
    noPermissionPage: string,
    notFoundPage: string,
    error(error: Error | any);
    root: string,
    role_session_key?: string
}) {
    cfg = options;
    if (typeof cfg.role_session_key == 'undefined') cfg.role_session_key = '__role';
}