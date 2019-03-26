  /*global module, require*/

  var jwt = require('jwt-simple');
  var logger = require('../../logger');

  module.exports = {

      beforeCreateClient: function() {
          var user = Math.random().toString(36).substring(7);

          var data = {
              room: "test_room1",
              user: user,
              wsUrl: "tokenUrl",
              secret: "thisissecret",
              appkey: "",
              iceServers: "",
              iceTransportPolicy: ""
          }

          var token = jwt.encode(data, data.secret);

          var op = {
              reconnection: true,
              reconnectionDelay: 2000,
              reconnectionDelayMax: 10000,
              reconnectionAttempts: 5,
              'force new connection': true,
              query: { token: this._auth.token }
          };
          return op;
      },
      /**
       * Before connection (just for faye)
       * @param {client} client connection
       */
      beforeConnect: function(client) {
          // Your logic
          // By example
          // client.setHeader('Authorization', 'OAuth abcd-1234');
          // client.disable('websocket');
      },

      /**
       * on socket io connect
       * @param {client} client connection
       * @param {done}   callback function(err) {}
       */
      onConnect: function(client, done) {
          // Your logic
          console.log("connect ok.");
          // client.subscribe('/test', function() {});
          client.on('message', function(msg) {
              console.log("receive login message");
          });


          client.emit('join', data, function(joined) {
              logger.info("login ok");

              client.emit('message', { content: "hello!" }, function() {
                  logger.info("send messsage");
              })
          })

          done();
      },

      /**
       * send a message
       * @param {client} client connection
       * @param {done}   callback function(err) {}
       */
      sendMessage: function(client, done) {
          //    logger.error('Not implement method sendMessage in generator');
          // Your logic        
          //client.emit('test', { hello: 'world' });
          //client.publish('/test', { hello: 'world' });

          client.emit('message', { content: "hello!" }, function() {})
          console.log("send message");

          done();
      }
  };