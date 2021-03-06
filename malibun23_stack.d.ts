interface SubscriptionMember {

    /**
     * Call inside the publish function.  Informs the subscriber that a document has been added to the record set.
     *
     * @locus Server
     *
     * @param {String} collection - <p>The name of the collection that contains the new document.</p>
     * @param {String} id - <p>The new document's ID.</p>
     * @param {Object} fields - <p>The fields in the new document.  If <code>_id</code> is present it is ignored.</p>
     */
    added(collection:string, id:string, fields:any):any;


    /**
     * Call inside the publish function.  Informs the subscriber that a document in the record set has been modified.
     *
     * @locus Server
     *
     * @param {String} collection - <p>The name of the collection that contains the changed document.</p>
     * @param {String} id - <p>The changed document's ID.</p>
     * @param {Object} fields - <p>The fields in the document that have changed, together with their new values.  If a field is not present in <code>fields</code> it was left unchanged; if it is present in <code>fields</code> and has a value of <code>undefined</code> it was removed from the document.  If <code>_id</code> is present it is ignored.</p>
     */
    changed(collection:string, id:string, fields:any):any;


    /**
     * Access inside the publish function. The incoming [connection](#meteor_onconnection) for this subscription.
     *
     * @locus Server
     */
    connection:any;


    /**
     * Call inside the publish function.  Stops this client's subscription, triggering a call on the client to the `onStop` callback passed to [`Meteor.subscribe`](#meteor_subscribe), if any. If `error` is not a [`Meteor.Error`](#meteor_error), it will be [sanitized](#meteor_error).
     *
     * @locus Server
     *
     * @param {Error} error - <p>The error to pass to the client.</p>
     */
    error(error:any):any;


    /**
     * Call inside the publish function.  Registers a callback function to run when the subscription is stopped.
     *
     * @locus Server
     *
     * @param {function} func - <p>The callback function</p>
     */
    onStop(func:Function):any;


    /**
     * Call inside the publish function.  Informs the subscriber that an initial, complete snapshot of the record set has been sent.  This will trigger a call on the client to the `onReady` callback passed to  [`Meteor.subscribe`](#meteor_subscribe), if any.
     *
     * @locus Server
     */
    ready():any;


    /**
     * Call inside the publish function.  Informs the subscriber that a document has been removed from the record set.
     *
     * @locus Server
     *
     * @param {String} collection - <p>The name of the collection that the document has been removed from.</p>
     * @param {String} id - <p>The ID of the document that has been removed.</p>
     */
    removed(collection:string, id:string):any;


    /**
     * Call inside the publish function.  Stops this client's subscription and invokes the client's `onStop` callback with no error.
     *
     * @locus Server
     */
    stop():any;


    /**
     * Access inside the publish function. The id of the logged-in user, or `null` if no user is logged in.
     *
     * @locus Server
     */
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

export class SimpleSchema {
    constructor(def: any);
}

export class MalibunCollection {
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

export class MalibunModel {
    collection: MalibunCollection;

    constructor(doc: any);

    update(modifier: any);

    remove();
}

export class MalibunEnumItem {
    key: string;
    label: string;

    constructor(key: string, label: string);

    valueOf(): string;

    toString(): String;
}

export class MalibunEnum {
    constructor(data: any);

    toSimpleSchema(options?: any): SimpleSchema;

    first(): MalibunEnumItem;

    exclude(keys: any): MalibunEnum;
}

export class MalibunCache {
    has(key: string): boolean;

    set(key: string, value: any, ttl: number);

    get(key: string): any;

    del(key: string);

    clear();

    size(): number;

    debug(): any;
}

export class MalibunController {
    name: string;

    constructor(collection: MalibunCollection);

    getTemplate(action: any): string;

    getRoute(action: any, urlParams?: any);

    init();
}

export class MongoHelper{
    constructor(selector?:any,options?: any);
    withOptions(opts?: any):this;
    withAnd(selector?:any):this;
    seletor():any;
    options():any;
}

export class MongoValidator{
    constructor();
    withFieldsAllow(fields:string[]):this;
    withFieldsDisallow(fields:string[]):this;
    contains(definedField:string,$modifierField:string):boolean;
    isOperator($key:string):boolean;
    isAllowed($modifierField:string):boolean;
    validate($modifier:any):boolean;
}
