"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ve_data_1 = require("./ve.data");
exports.__ve_parse_json = ve_data_1.__ve_parse_json;
exports.__ve_to_json = ve_data_1.__ve_to_json;
const context_1 = require("./context");
exports.HttpContext = context_1.HttpContext;
exports.cfg = {
    role_session_key: "__role"
};
/***
 * @param router express 路由
 *
 */
function use(router, routes, options) {
    config(options);
    routes.forEach(route => {
        (function (route) {
            var url = route.url;
            if (url.indexOf('?') > -1) {
                url = url.substring(0, url.indexOf('?'));
            }
            var encode_url = global.encodeURI(url);
            let handler = (req, res, next) => {
                var context = new context_1.HttpContext({ req, res, route }, exports.cfg);
                context.onHandle();
            };
            var method = route.method;
            if (!method)
                method = 'all';
            if (route.mine == 'file' || route.mine == 'image') {
                method = 'get';
            }
            router[method](url, handler);
            if (encode_url != url)
                router[method](encode_url, handler);
        })(route);
    });
    /****设置默认首页 */
    router.all('/', (req, res, next) => {
        var context = new context_1.HttpContext({ req, res }, exports.cfg);
        context.handleDefaultPage();
    });
    router.get('/__session/role', (req, res, next) => {
        var context = new context_1.HttpContext({ req, res }, exports.cfg);
        context.handleRoleSession();
    });
}
exports.use = use;
function config(options) {
    Object.assign(exports.cfg, options);
    if (typeof exports.cfg.role_session_key == 'undefined')
        exports.cfg.role_session_key = '__role';
}
exports.config = config;
