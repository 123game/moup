var uuid = require('node-uuid');
var redis = require('redis');

module.exports = function(port, host, options, callback) {

  var moup = {

    rc: {},

    connect: function(port, host, options, callback) {
      var host = host || "localhost";
      var port = port || 6379;
      var options = options || {};

      if (options.password) {
        options.no_ready_check = true;
      }

      moup.rc = redis.createClient(port, host, options);

      moup.rc.on('connect', function() {
        console.log('Connect to redis: %s:%d', host, port);

        if (options.password) {
          moup.rc.auth(options.password, function(err) {
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
      moup.getUserId(device_id, facebook_id, function(err, user_id) {
        if (err) {
          callback(err);
          return;
        }
        moup.rc.hgetall(user_id, function(err, object) {
          callback(err, object);
        });
      });
    },

    setProfile: function(device_id, facebook_id, object, callback) {
      moup.getUserId(device_id, facebook_id, function(err, user_id) {
        if (err) {
          callback(err);
          return;
        }
        moup.rc.hmset(user_id, object, function(err, res) {
          callback(err);
        });
      });
    },

    getUserId: function(device_id, facebook_id, callback) {
      if (facebook_id) {
        moup.rc.get(facebook_id, function(err, user_id) {
          if (user_id) {
            moup.rc.set(device_id, user_id);
            callback(err, user_id);
          } else {
            moup.rc.get(device_id, function(err, user_id) {
              if (user_id) {
                moup.rc.set(facebook_id, user_id);
              } else {
                user_id = uuid.v1();
                moup.rc.set(device_id, user_id);
                moup.rc.set(facebook_id, user_id);
              }
              callback(err, user_id);
            });
          }
        });
      } else {
        moup.rc.get(device_id, function(err, user_id) {
          if (!user_id) {
            user_id = uuid.v1();
            moup.rc.set(device_id, user_id);
          }
          callback(err, user_id);
        });
      }
    }
  };

  moup.connect(port, host, options, callback);
  return moup;
};
