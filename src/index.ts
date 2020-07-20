import { __ve_parse_json, __ve_to_json } from './ve.data';
import { Config, Route } from './declare';
import { HttpContext } from './context';
export var cfg: Config = {
    role_session_key: "__role"
} as any;
/***
 * @param router express 路由
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
    config(options);
    routes.forEach(route => {
        (function (route) {
            var url = route.url;
            if (url.indexOf('?') > -1) {
                url = url.substring(0, url.indexOf('?'));
            }
            var encode_url = global.encodeURI(url);
            let handler = (req, res, next) => {
                var context = new HttpContext({ req, res, route }, cfg);
                context.onHandle();
            }
            var method = route.method;
            if (!method) method = 'all';
            if (route.mine == 'file' || route.mine == 'image') {
                method = 'get';
            }
            router[method](url, handler);
            if (encode_url != url) router[method](encode_url, handler);
        })(route);
    });
    /****设置默认首页 */
    router.all('/', (req, res, next) => {
        var context = new HttpContext({ req, res }, cfg);
        context.handleDefaultPage();
    });
    router.get('/__session/role', (req, res, next) => {
        var context = new HttpContext({ req, res }, cfg);
        context.handleRoleSession();
    });
}
export function config(options: {
    upload_dir: string,
    roles: { text: string, type: 'default' | 'user' }[],
    defaultPage: string,
    errorPage: string,
    noPermissionPage: string,
    notFoundPage: string,
    error(...errors: (string | Error)[]);
    root: string,
    role_session_key?: string
}) {
    Object.assign(cfg, options);
    if (typeof cfg.role_session_key == 'undefined') cfg.role_session_key = '__role';
}
export { __ve_parse_json, __ve_to_json, HttpContext };

