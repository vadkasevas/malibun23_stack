import EventEmitter = NodeJS.EventEmitter;

interface IProxy{
    protocol:string
    ip:string
    port:number
}

declare class MalibunPromise<T>{
    constructor(
        f:(
            resolve:(result:T)=>any,
            reject:(err:Error|null,result:T)=>any
        )=>any
    );

    then(onResolved:(result:T)=>any, onRejected:(err:Error|null,result:T)=>any):MalibunPromise<T>;

    catch(onRejected:(err:Error|null,result:T)=>any):MalibunPromise<T>

    resolve():void;

    reject():void;

    finally(cb:(err:Error|null,result:T)=>any|MalibunPromise<T>, ctx:any);

    wait(ms:number):MalibunPromise<T>;

    sync():T;

    isResolved():boolean;

    static resolve(obj:any):MalibunPromise<any>;

    static reject(err:Error):MalibunPromise<null>;

    static isPromise(obj:any|MalibunPromise<any>):boolean;
}

declare class HttpClient extends EventEmitter {
    baseUrl: string;
    _url: string;
    getParams: object;
    timeout: number;
    headers: object;
    cookies: object;
    proxy?: IProxy
    httpMethod: string;
    postData: object;
    files: object[];
    useCookies: boolean;
    npmRequestOptions: object;
    formContentType: string;
    followLocation: boolean;
    redirectsCount: boolean;
    gzip: boolean;
    encoding: string;
    keepAlive: boolean;

    static forOptions(options: {
        url: string
        headers?: object,
        cookies?: any,
        proxy?: IProxy,
        httpMethod?: string,
        postData?: object
        files?: object[],
        formContentType?: string,
        followLocation?: boolean,
        timeout?: number
        gzip?: boolean
        keepAlive?: boolean
        encoding?: string
        referer?: string
        context?: HttpContext
        getParams?: object
    }): HttpClient;

    filteredExecute(filter: Function): MalibunPromise

    execute():{
        then(cb:Function);
        success(cb:Function);
        error(cb:Function);
    }

    withPostData(data:object):HttpClient;

    withFile(file:object):HttpClient;

    withProxy(proxy:IProxy):HttpClient;

    withNpmRequestOptions(options:object)

    withHttpMethod(method:string):HttpClient

    withGetParam(key:string,val:string):HttpClient;

    withHeader(hKey:string,hVal:string,safe?:boolean=false);

    withHeaders(headers:any,safe?:boolean=false);

    hasHeader(hKey:string):boolean;

    withCookies(cookies:any):HttpClient;

    withCookie(cookie:{
        name?:string,
        key?:string,
    }):HttpClient;

    getUrl():string;

    getHttpMethod():string;

    doIncomingCookies(content:{
        headers:object
    });

    withUrl(baseUrl:string):HttpClient;

    withHttpContext(context:HttpContext):HttpClient;

    static resolveUrl(base:string,to:string):string;

    static buildUrl(baseUrl:string,params:object):string;

    static overwriteGetParams(url:string,value:string):string;
}


declare class HttpContext extends EventEmitter{
    cookies:any[];

    constructor(options:{
        clearDomain?:boolean
    });
    onClient(client:HttpClient,options?:any);
    withCookies(cookies:any[]):boolean;
    withCookie(cookie:any):boolean;
    cookieByName(key:string,defaultValue:any):any;
    getCookieValue(key:string,defaultValue:any):any;
}


interface SubscriptionMember {
    added(collection:string, id:string, fields:any):any;
    changed(collection:string, id:string, fields:any):any;
    connection:any;
    error(error:any):any;
    onStop(func:Function):any;
    ready():any;
    removed(collection:string, id:string):any;
    stop():any;
    userId:any;
}

interface ISchemas {
    errors: {
        required: 'required',
        minString: 'minString',
        maxString: 'maxString',
        minNumber: 'minNumber',
        maxNumber: 'maxNumber',
        minDate: 'minDate',
        maxDate: 'maxDate',
        badDate: 'badDate',
        minCount: 'minCount',
        maxCount: 'maxCount',
        noDecimal: 'noDecimal',
        notAllowed: 'notAllowed',
        expectedString: 'expectedString',
        expectedNumber: 'expectedNumber',
        expectedBoolean: 'expectedBoolean',
        expectedArray: 'expectedArray',
        expectedObject: 'expectedObject',
        expectedConstructor: 'expectedConstructor',
        regEx: 'regEx',
    };

    autofill(options?: any): object;

    String(label: string, extOptions?: any): object;

    textarea(label: string, extOptions?: any)

    Number(label: string, extOptions?: any)

    created(label: string, extOptions?: any)

    date(label: string, extOptions?: any)

    updated(label: string, extOptions?: any)

    autocomplete(label: string, method: string, extOptions?: any)

    namedAutoComplete(label: string, collection: any, fieldName?: string, schemaOptions?: any, options?: any)

    Date(label: string, extOptions?: any)

    /**Тип - ES код, проверяемый на валидность через esprima, autoform тип - 'code', используется codemirror*/
    esCode(extOptions: any): {
        type: 'String', custom: Function, label: string, autoform: { cols: 10, rows: 10, type: 'code' },
    };
}

declare var Schemas: ISchemas;

class SimpleSchema {
    constructor(def: any);
}

class MalibunCollection {
    schema: SimpleSchema;

    constructor(name: string,
                options?: {
                    modelClass?: any,
                    permissions?: any,
                    MONGO_URL?: any
                });

    /**
     * Подписывается на изменения моделей
     *@locus Client
     * @param {any} selector - <p>Условие поиска</p>
     */
    subscribe(selector?: any): any;

    /**Поиск по ID*/
    byPk(id: string);

    /**Вставляет и возвращает документ в коллекцию
     * @param {any} doc  - <p>Документ для вставки</p>
     * */
    insertAndGet(doc: any);

    publishCursor(userId?: string, condition?: any, options?: any);

    userAuth(pagination: any, skip: number, sub: SubscriptionMember);

    adminAuth(pagination: any, skip: number, sub: SubscriptionMember);

    auth(userId: string, condition?: any, options?: any);

    static ready(names: any, callback: Function);

    _ensureIndex(keys: any, options: { unique?: boolean });
}

class MalibunModel {
    collection: MalibunCollection;

    constructor(doc: any);

    update(modifier: any);

    remove();
}

class MalibunEnumItem {
    key: string;
    label: string;

    constructor(key: string, label: string);

    valueOf(): string;

    toString(): String;
}

class MalibunEnum {
    constructor(data: any);

    toSimpleSchema(options?: any): SimpleSchema;

    first(): MalibunEnumItem;

    exclude(keys: any): MalibunEnum;
}

class MalibunCache {
    has(key: string): boolean;

    set(key: string, value: any, ttl: number);

    get(key: string): any;

    del(key: string);

    clear();

    size(): number;

    debug(): any;
}

class MalibunController {
    name: string;

    constructor(collection: MalibunCollection);

    getTemplate(action: any): string;

    getRoute(action: any, urlParams?: any);

    init();
}
