
function safeCall(optionalThis, func, errorReturnValue) {
    safeCall.error = null;

    if (typeof optionalThis === 'function') {
        errorReturnValue = func;
        func = optionalThis;
        optionalThis = null;
    }

    if (typeof errorReturnValue === 'undefined') {
        errorReturnValue = null;
    }

    try {
        return func.call(optionalThis);
    } catch (e) {
        safeCall.error = e;
        return errorReturnValue;
    }
}


// http://stackoverflow.com/questions/6491463
// currently, '.' is assumed to be the separator
function query(o, s, defaultValue) {
    if (!s) return o;

    if(typeof s !=='string')
        throw ( new Error('s must be a string, not '+typeof(s)) );

    s = s.replace(/\[(\w+)\]/g, '.$1'); // convert indexes to properties
    s = s.replace(/^\./, '');           // strip a leading dot

    var a = s.split('.'); // always returns an array
    for (var i = 0; i < a.length; i++) {
        var n = a[i];

        if (!o || typeof o !== 'object' || !(n in o)) return defaultValue;

        o = o[n];
    }
    return o;
}

// TODO: support array format like [0].some.value
function set(o, s, value) {
    if (!s) return o;
    if(typeof s !=='string')
        throw ( new Error('s must be a string, not '+typeof(s)) );
    if (!o || typeof o !== 'object') o = { };

    s = s.replace(/\[(\w+)\]/g, '.$1'); // convert indexes to properties
    s = s.replace(/^\./, '');           // strip a leading dot

    var a = s.split('.'); // always returns an array
    var io = o;
    for (var i = 0; i < a.length - 1; i++) {
        var n = a[i];

        if (!(n in io) || !io[n] || typeof io[n] !== 'object') {
            io[n] = { };
        }

        io = io[n];
    }

    io[a[a.length - 1]] = value;

    return o;
}

function unset(o, s) {
    if (!s) return o;

    if(typeof s !=='string')
        throw ( new Error('s must be a string, not '+typeof(s)) );

    if (!o || typeof o !== 'object') return o;

    s = s.replace(/\[(\w+)\]/g, '.$1'); // convert indexes to properties
    s = s.replace(/^\./, '');           // strip a leading dot

    var a = s.split('.'); // always returns an array
    var io = o;
    for (var i = 0; i < a.length - 1; i++) {
        var n = a[i];

        if (!(n in io)) return o;

        if (!io[n] || typeof io[n] !== 'object') {
            delete io[n];
            return o;
        }

        io = io[n];
    }

    delete io[a[a.length - 1]];

    return o;
}




safeCall.query = query;
safeCall.set = set;
safeCall.unset = unset;

safe = safeCall;

