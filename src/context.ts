import { Route, Config, HandleExceptionType } from "./declare";
import { __ve_parse_json, __ve_to_json } from ".";
const fs = require('fs');
const fss = require('fs-sync');
import path = require('path');

export class HttpContext {
    req;
    res;
    route: Route;
    cfg: Config;
    constructor(options: { req, res, route?: Route }, cfg: Config) {
        for (var n in options) this[n] = options[n];
        this.cfg = cfg;
    }
    private pickParameter() {
        var self = this;
        var parms = this.route.args;
        var args: (any | { __ve_type: string, value: any })[] = [];
        let getValue = (key) => {
            let gv = (data) => {
                if (typeof data[key] != 'undefined') return data[key]
                else if (typeof data[global.encodeURI(key)]) return data[global.encodeURI(key)]
            };
            var r;
            if (typeof (r = gv(self.req.body)) != 'undefined') return r;
            if (typeof (r = gv(self.req.params)) != 'undefined') return r;
            if (typeof (r = gv(self.req.query)) != 'undefined') return r;
        }
        if (Array.isArray(parms)) {
            parms.forEach(prop => {
                let key = prop.key || (prop as any).text;
                var type = typeof prop.type == 'object' ? 'object' : prop.type.toLowerCase();
                if (type.startsWith('ve.core.')) type = type.replace('ve.core.', "");
                switch (type) {
                    case 'image':
                    case 'file':
                        if (Array.isArray(self.req.files)) {
                            var file = self.req.files.filter(x => x.fieldname == key || global.decodeURI(x.fieldname) == key)[0];
                            if (file) {
                                if (file.originalname && file.originalname.indexOf('.') > -1) {
                                    var newFilePath = file.path + file.originalname.substring(file.originalname.indexOf('.'));
                                    fs.renameSync(file.path, newFilePath);
                                    file.path = newFilePath;
                                }
                                var cfgUploadDir = self.cfg.root + self.cfg.upload_dir;
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
                    case 'double':
                        var value = getValue(key);
                        if (typeof value == 'undefined') {
                            args.push(prop.value);
                        }
                        else {
                            var v = value;
                            if (type == 'int') {
                                v = parseInt(value);
                            }
                            else if (type == 'number' || type == 'double') {
                                v = parseFloat(value);
                            }
                            if (isNaN(v)) v = prop.value;
                            args.push(v);
                        }
                        return;
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
                        else if (type == 'array' && Array.isArray(prop.value)) return args.push(prop.value)
                        else if (type == 'object' && typeof prop.value == 'object') return args.push(prop.value)
                        break;
                    default:
                        if (typeof value != 'undefined') {
                            return args.push({ __ve_type: type, value });
                        }
                        args.push(undefined);
                        break;
                }
            })
        }
        return args;
    }
    /**
      * 
      * 如果当前的访问者没有，那么设为匿名默认
      * */
    private filterRole() {
        var roles = this.route && Array.isArray(this.route.roles) ? this.route.roles : [];
        var isAllowed: boolean = true;
        var role = this.req.session[this.cfg.role_session_key];
        var rs = this.cfg.roles || [];
        if (!role) {
            var sr = rs.find(x => x.type == 'default');
            if (sr) role = sr.text;
        }
        if (Array.isArray(roles) && roles.length > 0) {
            isAllowed = roles.some(x => x == role);
        }
        if (isAllowed == false) {
            this.handleException(HandleExceptionType.unauthorizedAccess, 'access forbidden...');
        }
        return isAllowed;
    }
    private get isView() {
        return this.route.mine == 'view' || this.route.mine == 'view-api' || (this.route.mine as any) == 'viewApi'
    }
    private get isFile() {
        return this.route.mine == 'file' || this.route.mine == 'image';
    }
    onHandle() {
        if (this.isView) {
            this.handleView();
        }
        else if (this.isFile) {
            this.handleFile();
        }
        else {
            this.handleService();
        }
    }
    handleDefaultPage() {
        if (this.cfg && this.cfg.defaultPage) return this.res.redirect(302, global.encodeURI(this.cfg.defaultPage));
        this.handleException(HandleExceptionType.pageNotFound);
    }
    handleFile(staticFilePath?: string) {
        if (typeof staticFilePath == 'undefined') {
            var url = this.req.url;
            if (url.indexOf('?') > -1) url = url.substring(0, url.indexOf('?'));
            url = decodeURI(url);
            staticFilePath = (this.cfg.root + url).replace(/\//g, "\\");
        }
        if (fs.existsSync(staticFilePath)) return this.res.sendFile(staticFilePath);
        else this.handleException(HandleExceptionType.serviceError, `not found file:${staticFilePath}`)
    }
    private findFilePath(filePath: string) {
        if (filePath.startsWith('/') || filePath.startsWith('\\')) filePath = path.join(this.cfg.root, filePath.substring(1));
        else {
            if (!fs.existsSync(filePath)) filePath = path.join(this.cfg.root, filePath);
        }
        return filePath;
    }
    ViewBag: Record<string, any>;
    private handleView() {
        if (Array.isArray(this.route.roles) && this.route.roles.length > 0 && (this.filterRole() == false)) return;
        var args = this.pickParameter();
        var viewControllerFilePath = this.findFilePath(this.route.controllerFilePath);
        var viewFilePath = this.findFilePath(this.route.viewFilePath);
        if (!fs.existsSync(viewControllerFilePath)) return this.handleException(HandleExceptionType.serviceError, `not found view controller js file:${viewControllerFilePath}`);
        if (!fs.existsSync(viewFilePath)) return this.handleException(HandleExceptionType.serviceError, `not found view  ejs file:${viewFilePath}`)
        var handlerFx = require(viewControllerFilePath);
        if (typeof handlerFx == 'function') {
            try {
                this.ViewBag = {};
                handlerFx.apply(this, [this, ...args]);
            }
            catch (e) {
                this.handleException(HandleExceptionType.serviceError, e, `the service file:${viewControllerFilePath} handling happend error`);
            }
        }
        else return this.handleException(HandleExceptionType.pageNotFound, `the view controller file:${viewControllerFilePath} is not function `)
    }
    private handleService() {
        if (Array.isArray(this.route.roles) && this.route.roles.length > 0 && (this.filterRole() == false)) return;
        var args = this.pickParameter();
        var serviceFilePath = this.findFilePath(this.route.serviceFilePath);
        if (!fs.existsSync(serviceFilePath)) return this.handleException(HandleExceptionType.pageNotFound, `not found server handle js file:${serviceFilePath}`)
        var handlerFx = require(serviceFilePath);
        if (typeof handlerFx == 'function') {
            try {
                handlerFx.apply(this, [this, ...args]);
            }
            catch (e) {
                this.handleException(HandleExceptionType.serviceError, e, `the service file:${serviceFilePath} handling happend error`);
            }
        }
        else return this.handleException(HandleExceptionType.pageNotFound, `the service file:${serviceFilePath} is not function `)
    }
    handleException(handleType: HandleExceptionType, ...args: any[]) {
        if (this.res.headersSent == true) return;
        switch (handleType) {
            case HandleExceptionType.serviceError:
                /***日志记录 */
                this.cfg.error(...args);
                if (this.cfg && this.cfg.errorPage) return this.res.redirect(302, global.encodeURI(this.cfg.errorPage));
                this.res.status(500).send('server happend error...');
                break;
            case HandleExceptionType.unauthorizedAccess:
                if (this.cfg && this.cfg.noPermissionPage) return this.res.redirect(302, global.encodeURI(this.cfg.noPermissionPage));
                this.res.status(404).send('not found page ...');
                break;
            case HandleExceptionType.pageNotFound:
                if (this.cfg && this.cfg.notFoundPage) return this.res.redirect(302, global.encodeURI(this.cfg.notFoundPage));
                this.res.status(404).send('not found page ...');
                break;
        }
    }
    handleRoleSession() {
        var role = this.req.session[this.cfg.role_session_key];
        var rs = this.cfg.roles || [];
        if (!role) {
            var sr = rs.find(x => x.type == 'default');
            if (sr) role = sr.text;
        }
        this.res.json({ role });
    }
    callback(data) {
        if (this.res.headersSent == true) return;
        data = __ve_to_json(data);
        if (this.isView) {
            var ejs = require('ejs');
            this.ViewBag = __ve_to_json(this.ViewBag);
            var viewFilePath = this.findFilePath(this.route.viewFilePath);
            ejs.renderFile(viewFilePath, {
                ViewBag: this.ViewBag,
                httpContext: this
            }, { cache: false }, (err, html) => {
                this.cfg.error(err);
                if (err) this.handleException(HandleExceptionType.serviceError, `render view file:${viewFilePath} is error.`);
                else this.res.status(200).send(html);
            });
        }
        else {
            data = __ve_to_json(data);
            this.res.status(200).json(data || {});
        }
    }
    error(error: string | Error) {
        if (this.res.headersSent == true) return;
        this.handleException(HandleExceptionType.serviceError, error);
    }
    next: () => void;
    void() {
        if (typeof this.next == 'function') {
            var ne = this.next;
            delete this.next;
            ne();
        }
        this.callback({ void: {} });
    }
    monitor(...args: any[]) {
        if (this.cfg && typeof this.cfg.monitor == 'function')
            this.cfg.monitor(...args);
    }
    redict(url) {
        if (this.res.headersSent == true) return;
        this.res.redict(url);
    }
}