'use strict';

var events = require('events');
var jwtDecode = require('jwt-decode'); // eslint-disable-line no-unused-vars
var jwt = require('jwt-simple');

var logger = require('../../logger');


function RTCEngine() {

    //super();
    this.setMaxListeners(Infinity);

    this._localStreams = new Map();
    this._remoteStreams = new Map();

    this._state = RTCEngine.NEW;
    this._streams = new Map(); // {streamId: any}

    this._signaling = null;
    this._auth = null;
    this._iceServers = null;
    this._iceTransportPolicy = null;
    this._iceConnected = false;
    this._iceCandidatePoolSize = 1;

    this._socket = null;


    this.setSocket = function(wsclient) {
        this._socket = wsclient;
    }

    this.getState = function() {
        return this._state;
    }


    this.joinRoom = function(token) {
        if (this._state === RTCEngine.CONNECTED) {
            logger.error("RTCEngine has connected");
            return;
        }
        try {
            this._auth = jwtDecode(token);
        } catch (error) {
            logger.error('error')
            this.emit('error', error)
            return;
        }
        this._auth.token = token;

        // iceservers
        this._iceServers = this._auth.iceServers;

        // iceTransportPolicy
        this._iceTransportPolicy = this._auth.iceTransportPolicy;

        this._setupSignalingClient();
    }

    this.leaveRoom = function() {
        if (this._state === RTCEngine.DISCONNECTED) {
            logger.error("leaveRoom state already is DISCONNECTED");
            return;
        }
        this._sendLeave();

        this._close();
    }

    this.sendMessage = function(msg) {
        if (this._state != RTCEngine.CONNECTED) {
            logger.error("need join room at first.");
            return;
        }

        this._socket.emit('message', { content: msg }, () => {});
    }

    this.generateTestToken = function(tokenUrl, appkey, room, user) {
        let data = {
            room: room,
            user: user,
            wsUrl: tokenUrl,
            secret: "thisissecret",
            appkey: appkey,
            iceServers: "",
            iceTransportPolicy: ""
        }

        let token = jwt.encode(data, secret);
        return token;
    }

    this._close = function() {
        if (this._state === RTCEngine.DISCONNECTED) {
            return;
        }

        this._setState(RTCEngine.DISCONNECTED);

        if (this._signaling) {
            this._signaling.close();
        }
    }

    this._setState = function(state) {
        if (this._state === state) {
            return;
        }
        this._state = state;
        this.emit('state', this._state);
    }


    this._setupSignalingClient = function() {

        this._socket.on('connect', () => {
            this._join();
        })

        this._socket.on('error', () => {
            this.close();
        })

        this._socket.on('disconnect', (reason) => {
            logger.error('disconnect', reason);
            this._close();
        })

        this._socket.on('message', async(data) => {
            this.emit('message', data);
        })

        this._socket.on('configure', async(data) => {
            this._handleConfigure(data);
        })

        this._socket.on('streampublished', async(data) => {
            this._handleStreamPublished(data)
        })

        this._socket.on('streamunpublished', async(data) => {
            this._handleStreamUnpublished(data)
        })

    }

    this._join = function() {

        const data = {
            appkey: this._auth.appkey,
            room: this._auth.room,
            user: this._auth.user,
            token: this._auth.token
        }

        this._socket.emit('join', data, async(joined) => {

            let streams = joined.room.streams;

            streams.forEach((stream) => {
                this._streams.set(stream.publisherId, stream.data);
            });

            this._setState(RTCEngine.CONNECTED);

            this.emit('joined', streams);
        })
    }

    this._sendLeave = function() {
        this._socket.emit('leave', {}, () => {});
    }
}

RTCEngine.prototype = new events.EventEmitter();

RTCEngine.NEW = 'new';
RTCEngine.CONNECTING = 'connecting';
RTCEngine.CONNECTED = 'connected';
RTCEngine.DISCONNECTED = 'disconnected';
RTCEngine.CLOSED = 'closed';