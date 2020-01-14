"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/****
    * ve数据转成正常的JSON数据
    *
    */
function veParseJson(data) {
    if (data === null || data === undefined)
        return data;
    else if (Array.isArray(data))
        return data.map(x => veParseJson(x));
    else if (data instanceof Date)
        return data;
    else if (typeof data == 'object' && typeof data.__ve_type == 'string') {
        switch (data.__ve_type) {
            case 'int':
                return data.value;
            case 'date':
            case 'Date':
                if (typeof data.value == 'number' || /[\d]/.test(data.value)) {
                    return new Date(typeof data.value == 'number' ? data.value : parseInt(data.value));
                }
                else if (data.value instanceof Date)
                    return data.value;
                break;
            case 'url':
            case 'color':
                break;
        }
        return data;
    }
    else if (typeof data == 'object') {
        var json = {};
        for (var n in data) {
            json[n] = veParseJson(data[n]);
        }
        return json;
    }
    else
        return data;
}
exports.__ve_parse_json = veParseJson;
/***
 * json数据转成ve数据
 *
 */
function veToJson(data) {
    if (data === null || data === undefined)
        return data;
    else if (Array.isArray(data))
        return data.map(x => veToJson(x));
    else if (data instanceof Date)
        return { __ve_type: 'date', value: data.getTime() };
    else if (typeof data == 'object') {
        var json = {};
        for (var n in data) {
            json[n] = veToJson(data[n]);
        }
        return json;
    }
    return data;
}
exports.__ve_to_json = veToJson;
