/*global module, require*/

require('engine');

var logger = require('./logger');

rtcEngine = null;

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


        rtcEngine = new RTCEngine(client);

        rtcEngine.on('addLocalStream', (stream) => {

            console.log('addLocalStream =========', stream);

        });

        rtcEngine.on('removeLocalStream', (stream) => {
            console.log('removeLocalStream ======', stream);
        });

        rtcEngine.on('addRemoteStream', (stream) => {
            console.log('addRemoteStream ', stream);
        });

        rtcEngine.on('removeRemoteStream', (stream) => {
            console.log('removeRemoteStream ', stream);
        });

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

        rtcEngine.on('muteRemoteVideo', (stream, muted) => {
            console.log('remote stream ', stream.streamId);
            console.log('remote stream video muted ', muted);
        });

        rtcEngine.on('muteRemoteAudio', (stream, muted) => {
            console.log('remote stream ', stream.streamId);
            console.log('remote stream audio muted ', muted);
        });

        rtcEngine.on('streamPublished', async(stream) => {
            console.error('streamPublished');
            console.dir(stream)

            if (stream) {
                let streamId = stream.publisherId;
                //await rtcEngine.subscribe(streamId);
            }
        })

        rtcEngine.on('streamUnpublished', async(stream) => {
            console.error('streamUnpublished');
        })

        rtcEngine.on('state', async(state) => {
            if (state === RTCEngine.CONNECTED) {
                //rtcEngine.publish(localStream);
            }
        });

        const token = await rtcEngine.generateTestToken(tokenUrl, appSecret, room, user);
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