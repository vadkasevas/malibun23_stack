import {Meteor} from "meteor/meteor";

declare module 'meteor/meteor' {
    namespace Meteor{
        export function userIsInRole(userId:string,role:string):Boolean;
        export function userIdIsAdmin(userId:string):Boolean;
        export function userIdIsCompany(userId:string):Boolean;
        export function isAdmin():Boolean;
        export function isCompany():Boolean;
        export function currentUserId(userId?:string):string;
        export function currentUser(userId?:string):Meteor.User;
    }
}