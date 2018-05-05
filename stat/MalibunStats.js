/**
 * @property {string} type
 * @property {string} label
 * @property {number} precision
 * @property {Date} date_from
 * @property {Date} date_to
 * @property {Date} expires
 * @property {object} data
 * @property {string} root
 */
//@component
class MalibunStatsModel extends MalibunModel{

};


/**
 * @method
 * @name MalibunStats#findOne
 * @param {object} selector - <p>A query describing the documents to find</p>
 * @returns MalibunStatsModel
 */

MalibunStats = new MalibunCollection('malibunStats',{
    modelClass:MalibunStatsModel,
    permissions:{
        group:{
            [Roles.ROLE_ADMIN]:'rw'
        }
    }
});

/**@name TypeOptions
 * @function
 * @name TypeOptions#expires
 * @param {MalibunStatsModel} model
 * @returns Date
 */
 /**@function
 * @name TypeOptions#precision
 * @param {MalibunStatsModel} model
 * @returns Number
 */
 /** @function
 * @name TypeOptions#join
 * @param {MalibunStatsModel} model2
 * @this MalibunStatsModel
 * @returns undefined
 */


/**@param {TypeOptions} opts*/
MalibunStats.registerType = function(type,opts){
    MalibunStats.types[type] = opts;
};



MalibunStats.create = function(type,label,data){
    /**@type {TypeOptions}
     * @returns {MalibunStatsModel}
     */
    var opts = MalibunStats.types[type];
    if(opts){
        /**@type {MalibunStatsModel}*/
        var model = {
            type:type, label:label,
            date_from:new Date(),
            root:null,
            data:data||{}
        };
        model.precision = opts.precision(model);
        model.expires = opts.expires(model);
        model.date_to = new Date(model.date_from+model.precision*1000);
        return model;
    }
};
MalibunStats.types = {};