/*global module, require*/

var RTCEngine = require('./engine');

var logger = require('../../logger');

var rtcEngine = null;

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
        // client.subscribe('/test', function() {});
        client.on('login', function(msg) {
            //       console.log("receive login message");
        });


        rtcEngine = new RTCEngine();
        rtcEngine.setSocket(client);


        rtcEngine.on('state', (newState) => {
            console.log('state change ', newState);
        });

        rtcEngine.on('joined', async(streams) => {
            console.dir(streams)

            //for (let stream of streams) {
            //    await rtcEngine.subscribe(stream.publisherId);
            //}
        })

        rtcEngine.on('peerConnected', (peerId) => {
            console.log('new peer come ', peerId);
        });

        rtcEngine.on('peerRemoved', (peerId) => {
            console.log('peer has leave ', peerId);
        });


        rtcEngine.on('message', async(data) => {
            console.error(data.content);
        })

        rtcEngine.on('state', async(state) => {
            if (state === RTCEngine.CONNECTED) {
                //rtcEngine.publish(localStream);
            }
        });

        let user = Math.random().toString(36).substring(7);
        const token = rtcEngine.generateTestToken1("tokenUrl", "", "test_room1", user);
        rtcEngine.joinRoom(token);


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

        rtcEngine.sendMessage("hello!");

        done();
    }
};