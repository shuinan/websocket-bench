  /*global module, require*/

  var jwt = require('jwt-simple');
  var logger = require('../../logger');

  var auth_data = {};

  var curConnectedUsers = 0;
  var curReceivedMsgNum = 0;

  module.exports = {

      beforeCreateClient: function() {
          var user = Math.random().toString(36).substring(7);
          auth_data = {
              room: "room_" + curConnectedUsers / 50,
              user: user,
              wsUrl: "tokenUrl",
              secret: "thisissecret",
              appkey: "",
              iceServers: "",
              iceTransportPolicy: ""
          }

          var token = jwt.encode(auth_data, auth_data.secret);

          var options = {
              reconnection: true,
              reconnectionDelay: 2000,
              reconnectionDelayMax: 10000,
              reconnectionAttempts: 5,
              transports: ['websocket'],
              'force new connection': true,
              query: { token: token }
          };
          return options;
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
          //console.log("connect ok.");
          // client.subscribe('/test', function() {});
          client.on('message', function(msg) {
              if (++curReceivedMsgNum % 1000 == 0) {
                  console.log("receive message: " + curReceivedMsgNum);
              }
          });


          if (++curConnectedUsers % 100 == 0) {
              console.log("Connected user: " + curConnectedUsers);
          }
          client.emit('join', auth_data, function(joined) {
              if (curConnectedUsers % 1000 == 0) {
                  logger.info("joined " + curConnectedUsers);
              }
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
              //console.log("send message");

          done();
      }
  };