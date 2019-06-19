import {Roles} from 'meteor/alanning:roles';


declare module 'meteor/alanning:roles'{
    namespace Roles{
        const ROLE_ADMIN='admin';
        const ROLE_COMPANY='company';
        const ROLE_GUEST='guest';
    }
}