'use strict';

// like _.defaults() but recursive
module.exports = function defaults(obj) {
  // recursive default
  function internalDefault(obj, source) {
    if (source) {
      for(let key in source) {
        if (obj[key] === void 0) {
          obj[key] = source[key];
        } else {
          internalDefault(obj[key], source[key]);
        }
      }
    }
    return obj;
  }

  obj = Object(obj);
  var length = arguments.length;
  if (length < 2 || obj == null) {
    return obj;
  }
  for (let index = 1; index < length; index++) {
    internalDefault(obj, arguments[index]);
  }
  return obj;
};
