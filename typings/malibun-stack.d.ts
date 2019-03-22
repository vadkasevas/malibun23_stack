import {Cursor, Mongo, ObjectID, Selector} from "meteor/mongo";
import {EventEmitter} from "events";
import {Meteor} from "meteor/meteor";
import {SimpleSchema} from "meteor/aldeed:simple-schema";
import {MalibunCollection} from "meteor/malibun-stack";

declare module 'meteor/mongo'{
    namespace Mongo{
        export interface CollectionStatic{
            getDriverByUrl(MONGO_URL: string, OPLOG_URL?: string): Mongo.Cursor<any>;
        }
        export interface Collection<T> {
            _name:string;
            _defineBatchInsert():any;
            attachSchema(schema:SimpleSchema,options?:{replace:boolean});
        }
    }
}

declare module 'meteor/malibun-stack' {
    export class MalibunCollection<T> extends Mongo.Collection<T> {
        static emitter: EventEmitter;
        _options: object;
        permissions: CollectionPermissions;
        schema: SimpleSchema;
        _schema: SimpleSchema;
        ready: boolean;

        _defineBatchInsert(): any;

        subscribe(selector: Selector<T> | ObjectID | string): Meteor.SubscriptionHandle;

        byPk(id: string): T;

        insertAndGet(T): T;

        publishCursor(userId: string, condition: Selector<T> | ObjectID | string, options?: object): Cursor<T>;

        userAuth(pagination: any, skip?: number, sub?: Meteor.SubscriptionHandle): Cursor<T>;

        adminAuth(pagination: any, skip?: number, sub?: Meteor.SubscriptionHandle): Cursor<T>;

        auth(userId: string, condition?: Selector<T>, options?: object): Cursor<T>;

        labels(fields: string[]): string[];

        static ready(names: string | string[], cb: Function): void;
    }

    export class MalibunModel<T> {
        _id: string;
        collection: MalibunCollection<T>;

        update(update: string[] | T | string | object): number;

        remove(): number;
    }

    export function clearHelperArguments(): any;

    export function combineClasses(baseClass, ...mixins): any;

    export function extend(deep: boolean, target: object, source: object): object;

    export function md5(s: string): Buffer;

    export function getRandHash(): string;

    export function stringify(obj: object): string;

    export function inArray(arr: any[], needle: any): Boolean;

    export function isset(obj: any): Boolean;

    export function objectSize(obj: object): number;

    export function firstKey(obj: object): number | string;

    export function randKey(object: object | any[]): number | string;

    export function randValue(object: object | any[]): any;

    export function randArrValue(arr: any[]): any;

    export function eachObjectField(obj: any, callback: Function): void;

    export function generateRandomHash():string;

    export function formatRuBoolean(val:Boolean):string;

    export function safeGet (obj:any, props:string|string[], defaultValue?:any):any;

    export function deserializeDate(dateS:string):Date;

    export function keyValueChunks(objOrArray:object|any[],key:string,size:number):any[];




}