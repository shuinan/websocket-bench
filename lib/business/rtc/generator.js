/*global module, require*/

//var RTCEngine = require('./engine');
var jwt = require('jwt-simple');
var logger = require('../../logger');

//var rtcEngine = null;


module.exports = {

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

        let user = Math.random().toString(36).substring(7);

        let data = {
            room: "test_room1",
            user: user,
            wsUrl: "tokenUrl",
            secret: "thisissecret",
            appkey: "",
            iceServers: "",
            iceTransportPolicy: ""
        }

        let token = jwt.encode(data, data.secret);

        client.emit('join', data, (joined) => {
            logger.info("login ok");
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

        client.emit('message', { content: "hello!" }, () => {})
console.log("send message");

        done();
    }
};
