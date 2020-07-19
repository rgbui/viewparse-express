import { __ve_parse_json, __ve_to_json } from './ve.data';
import { Config, Route } from './declare';
import { HttpContext } from './context';
export declare var cfg: Config;
/***
 * @param router express 路由
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
    error(...errors: (string | Error)[]): any;
    root: string;
    role_session_key?: string;
}): void;
export { __ve_parse_json, __ve_to_json, HttpContext };
