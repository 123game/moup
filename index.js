var uuid = require('node-uuid');
var redis = require('redis');

var rc;

module.exports = {

  connect(): function(port, host, options, callback) {
    var host = host || "localhost";
    var port = port || 6379;
    var options = options || {};

    if (options.password) {
      options.no_ready_check = true;
    }

    rc = redis.createClient(port, host, options);

    rc.on('connect', function() {
      console.log('Connect to redis: %s:%d', host, port);
      if (options && options.password) {
        rc.auth(options.password, function(err) {
          if (callback) {
            callback(err);
          }
        });
      } else {
        if (callback) {
          callback(null);
        }
      }
    });
  },

  getProfile: function(device_id, facebook_id, callback) {
    getUserId(device_id, facebook_id, function(user_id) {
      if (rc) {
        rc.hgetall(user_id, function(err, object) {
          callback(err, object);
        });
      } else {
        callback("Error: not connect to redis");
      }
    });
  },

  setProfile: function(device_id, facebook_id, object) {
    if (object) {
      getUserId(device_id, facebook_id, function(user_id) {
        rc.hmset(user_id, object);
      });
    }
  },

  getUserId: function(device_id, facebook_id, callback) {
    var user_id;
    if (facebook_id) {
      rc.get(facebook_id, function(err, reply) {
        user_id = reply;
        if (user_id) {
          rc.set(device_id, user_id);
          callback(err, user_id);
        } else {
          rc.get(device_id, function(err, reply) {
            user_id = reply;
            if (user_id) {
              rc.set(facebook_id, user_id);
            } else {
              user_id = uuid.v1();
              rc.set(device_id, user_id);
              rc.set(facebook_id, user_id);
            }
            callback(err, user_id);
          });
        }
      });
    } else {
      rc.get(device_id, function(err, reply) {
        user_id = reply;
        if (!user_id) {
          user_id = uuid.v1();
          rc.set(device_id, user_id);
        }
        callback(err, user_id);
      });
    }
  }

};
