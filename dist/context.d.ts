import { Route, Config, HandleExceptionType } from "./declare";
export declare class HttpContext {
    req: any;
    res: any;
    route: Route;
    cfg: Config;
    constructor(options: {
        req: any;
        res: any;
        route?: Route;
    }, cfg: Config);
    private pickParameter;
    /**
      *
      * 如果当前的访问者没有，那么设为匿名默认
      * */
    private filterRole;
    private readonly isView;
    private readonly isFile;
    onHandle(): void;
    handleDefaultPage(): any;
    handleFile(staticFilePath?: string): any;
    private findFilePath;
    ViewBag: Record<string, any>;
    private handleView;
    private handleService;
    handleException(handleType: HandleExceptionType, ...args: any[]): any;
    callback(data: any): void;
    error(error: string | Error): void;
    next: () => void;
    void(): void;
    monitor(...args: any[]): void;
    redict(url: any): void;
}
