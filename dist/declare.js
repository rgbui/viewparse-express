"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/****定义一些错误异常类型 */
var HandleExceptionType;
(function (HandleExceptionType) {
    /****服务器出错 */
    HandleExceptionType[HandleExceptionType["serviceError"] = 500] = "serviceError";
    /****页面不存在 */
    HandleExceptionType[HandleExceptionType["pageNotFound"] = 404] = "pageNotFound";
    /****无权限 */
    HandleExceptionType[HandleExceptionType["unauthorizedAccess"] = 405] = "unauthorizedAccess";
})(HandleExceptionType = exports.HandleExceptionType || (exports.HandleExceptionType = {}));
;
