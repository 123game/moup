var uuid = require('node-uuid');
var redis = require('redis');

/**
 * Validate Facebook access token
 *
 * @param	{String} user_id, user_access_token, app_access_token
 * @return callback {bool}
 */
var rc;

module.exports = {

  connect(): function(port, host, options, callback) {
    var host = host || "localhost";
    var port = port || ;
    var rc = redis.createClient(port, host, options);

    rc.on('connect', function() {
      console.log("Connect to redis: %s:%d");
			if (options && options.password) {
				rc.auth(options.password, function(err) {
	        if (callback) {
	          callback(err);
	        }
	      });
			}
    });
  },

  getProfile: function(device_id, facebook_id, callback) {
    getUserId(device_id, facebook_id, function(user_id) {
      rc.hgetall(user_id, function(err, object) {
        callback(object);
      });
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
          callback(user_id);
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
            callback(user_id);
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
        callback(user_id);
      });
    }
  }

};
