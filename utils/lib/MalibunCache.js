MalibunCache = class MalibunCache extends EventEmitter{
    constructor(){
        super();
        this.setMaxListeners(0);
        this.store = {};
    }

    has(key){
        return isset(this.store[key]);
    }

    /**
     * Insert or overwrite data
     *
     * @param {string} key
     * @param {mixed} value
     * @param {number} ttl   Time to live in milliseconds (optional)
     */
    set(key, value, ttl){
        if(typeof key === 'undefined') throw new Error('Required argument key is undefined');
        var oldRecord = this.has(key)? this.store[key] : undefined;
        if(oldRecord && oldRecord.timeout){
            clearTimeout(oldRecord.timeout);
        }

        // Set value + timeout on new record
        var record = {value: value};
        if(typeof ttl === 'number'&&ttl>0){
            record.timeout = setTimeout(()=>{
                this.del(key);
            },ttl);
        }
        this.store[key] = record;

        // Emit update/set events
        var action = oldRecord? 'update' : 'set';
        this.emit(action, key, value, ttl);
        this.emit(action + ':' + key, value, ttl);
    };

    /**
     * Get cached data
     *
     * @param {string} key
     * @param {function} callback  Return value in callback if records exists locally or on external resource (optional)
     * @return {mixed} value Only returned if callback is undefined
     */
    get(key){
        if(typeof key === 'undefined')
            throw new Error('Required argument key is undefined');
        var record = this.store[key];
        if(record){
            return record.value;
        }
    };

    /**
     * Delete cached data
     *
     * @param {string} key
     * @return {boolean} Returns true if record existed
     */
    del(key){
        if(typeof key === 'undefined') throw new Error('Required argument key is undefined');
        if(this.has(key)){
            if(this.store[key].timeout){
                clearTimeout(this.store[key].timeout);
            }
            delete this.store[key];
            this.emit('del', key);
            this.emit('del:' + key);
            return true;
        }else{
            return false;
        }
    }

    /**
     * Clear cached data
     *
     * @return {number} Returns number of cleared records
     */
    clear(){
        var size = this.size();
        _.each(_.keys(this.store),(key)=>{
            this.del(key);
        });
        this.store = {};
        this.emit('clear', size);
        return size;
    };

    /**
     * Retrieve number of records
     *
     * @return {number}
     */
    size(){
        return _.size(this.store);
    };

    /**
     * Retrieve internal store
     *
     * @return {object}
     */
    debug(){
        return this.store;
    };




};