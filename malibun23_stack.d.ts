import {MalibunModel, MalibunServersInterface, MalibunServersModel} from "meteor/malibun23:stack";

declare module 'meteor/mongo'{
    import {SimpleSchema} from 'meteor/aldeed:simple-schema';
    namespace Mongo{
        export interface CollectionStatic{
            getDriverByUrl(MONGO_URL: string, OPLOG_URL?: string): Mongo.Cursor<any>;
        }
        export interface Collection<T> {
            _name:string;
            _defineBatchInsert():any;
            attachSchema(schema:SimpleSchema,options?:{replace:boolean});
        }
        interface ObjectID {
            _str: string;
        }
    }
}

declare module 'meteor/malibun23:stack' {
    import EventEmitter from 'events';
    import {Mongo} from 'meteor/mongo';
    import {SimpleSchema} from 'meteor/aldeed:simple-schema';
    import * as urlParser from 'url';
    import Selector = Mongo.Selector;

    export class MalibunCollection<T> extends Mongo.Collection<T> {
        static emitter: EventEmitter;
        _options: object;
        permissions: any;
        schema: SimpleSchema;
        _schema: SimpleSchema;
        ready: boolean;

        constructor(name:string,options:{
            modelClass:any,
            permissions:any
        })

        _defineBatchInsert(): any;

        subscribe(selector: Selector<T> | Mongo.ObjectID | string): Meteor.SubscriptionHandle;

        byPk(id: string): T;

        insertAndGet(T): T;

        publishCursor(userId: string, condition: Selector<T> | Mongo.ObjectID | string, options?: object): Mongo.Cursor<T>;

        userAuth(pagination: any, skip?: number, sub?: Meteor.SubscriptionHandle): Mongo.Cursor<T>;

        adminAuth(pagination: any, skip?: number, sub?: Meteor.SubscriptionHandle): Mongo.Cursor<T>;

        auth(userId: string, condition?: Selector<T>, options?: object): Mongo.Cursor<T>;

        labels(fields: string[]): string[];

        static ready(names: string | string[], cb: Function): void;

        vueMethods():void;
        vueSchema:any;
    }

    export class MalibunModel<T> {
        _id: string;
        collection: MalibunCollection<T>;

        update(update: string[] | T | string | object): number;

        remove(): number;
    }

    interface IHttpClient{
        urlParser:typeof urlParser;
    }
    export const HttpClient:IHttpClient;


    interface IMalibunStorage {
        ensureDir(file:string):string;
    }
    export const MalibunStorage:IMalibunStorage;

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

    var Schemas: ISchemas;

    export class MalibunServersModel extends MalibunModel{
        serverConfigs:any[];
    }
    class MalibunServersInterface extends MalibunCollection<MalibunServersModel>{
        connections:object;
        schemaDef:object;
        current(cb:Function):MalibunServersModel;
        isMaster():boolean;
    }

    export const MalibunServers:MalibunServersInterface;

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

    export class MalibunPromise {
        constructor(fun:Function);
        then(onResolved:Function, onRejected:Function):MalibunPromise;
        catch(onRejected:Function):MalibunPromise;
        resolve(result1:any,result2?:any,result3?:any):void;
        reject(err:Error,result?:any):void;
        finally(cb:Function,ctx?:any):MalibunPromise;
        sync();
        isResolved():Boolean;
        static resolve(result1:any):MalibunPromise;
        static reject(err:Error):MalibunPromise;
        static isPromise(obj:any):Boolean;
    }

    export function clearHelperArguments(): any;

    export function combineClasses(baseClass, ...mixins): any;

    export function extend(deep: boolean, target: object, source: object): object;

    export function md5(s: string): Buffer;

    export function getRandHash(): string;

    export function stringify(obj: object): string;

    export function inArray(arr: any[], needle: any): Boolean;

    export function isset(obj: any): Boolean;

    export function randKey(object: object | any[]): number | string;

    export function randValue(object: object | any[]): any;

    export function randArrValue(arr: any[]): any;

    export function eachObjectField(obj: any, callback: Function): void;

    export function generateRandomHash():string;

    export function formatRuBoolean(val:Boolean):string;

    export function safeGet (obj:any, props:string|string[], defaultValue?:any):any;

    export function deserializeDate(dateS:string):Date;

    export function keyValueChunks(objOrArray:object|any[],key:string,size:number):any[];

    export function formatRuDate(date?:Date):string;

}


