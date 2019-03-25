'use strict';

var events = require('events');
var jwtDecode = require('jwt-decode'); // eslint-disable-line no-unused-vars
var jwt = require('jwt-simple');

var logger = require('../../logger');


class RTCEngine extends events.EventEmitter {
    constructor() {
        super();
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
    }
    setSocket(wsclient) {
        this._socket = wsclient;
    }

    getState() {
        return this._state;
    }

    getLocalStreams() {
        return Array.from(this._localStreams.values())
    }

    getRemoteStreams() {
        return Array.from(this._remoteStreams.values())
    }


    joinRoom(token) {
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
    leaveRoom() {
        if (this._state === RTCEngine.DISCONNECTED) {
            logger.error("leaveRoom state already is DISCONNECTED");
            return;
        }
        this._sendLeave();

        this._close();
    }

    sendMessage(msg) {
        if (this._state != RTCEngine.CONNECTED) {
            logger.error("need join room at first.");
            return;
        }

        this._socket.emit('message', { content: msg }, () => {});
    }

    async generateTestToken(tokenUrl, appkey, room, user) {

        const response = await fetch(tokenUrl, {
            body: JSON.stringify({
                appkey: appkey,
                room: room,
                user: user
            }),
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            method: 'POST'
        });

        let data = await response.json();

        return data.d.token
    }
    generateTestToken1(tokenUrl, appkey, room, user) {
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

    _close() {
        if (this._state === RTCEngine.DISCONNECTED) {
            return;
        }

        this._setState(RTCEngine.DISCONNECTED);

        if (this._signaling) {
            this._signaling.close();
        }

        for (let stream of this._localStreams) {
            if (stream._audioSender) {
                stream._peerconnection.removeTrack(stream._audioSender)
            }

            if (stream._videoSender) {
                stream._peerconnection.removeTrack(stream._videoSender)
            }
        }

        for (let stream of this._remoteStreams.values()) {
            stream.close();
            this.emit('removeRemoteStream', stream);
        }

        this._localStreams.clear();
        this._remoteStreams.clear();
    }
    _setState(state) {
        if (this._state === state) {
            return;
        }
        this._state = state;
        this.emit('state', this._state);
    }


    _setupSignalingClient() {

        this._socket.on('connect', async() => {
            await this._join();
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

    _handleStreamPublished(data) {
        let stream = data.stream;

        this.emit('streamPublished', stream);
    }

    _handleStreamUnpublished(data) {

        let stream = data.stream;

        const remoteStream = this._remoteStreamForPublish(stream.publisherId);

        if (!remoteStream) {
            console.dir('can not find remote stream', stream);
            console.dir(this._remoteStreams)
            return;
        }
        this._remoteStreams.delete(remoteStream.streamId);

        remoteStream.close();

        this.emit('streamUnpublished', remoteStream)

    }
    _handleConfigure(data) {

        let streamId = data.streamId;

        let remoteStream = this._remoteStreams.get(streamId);

        if (!remoteStream) {
            return;
        }

        if ('video' in data) {
            let muting = data.muting;
            remoteStream._onVideoMuting(muting);
            this.emit('muteRemoteVideo', remoteStream, muting);
            return;
        }

        if ('audio' in data) {
            let muting = data.muting;
            remoteStream._onAudioMuting(muting);
            this.emit('muteRemoteAudio', remoteStream, muting);
            return;
        }
    }
    async _join() {

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
    _sendLeave() {
        this._socket.emit('leave', {}, () => {});
    }
    _sendConfigure(data) {
        this._socket.emit('configure', data, () => {});
    }
    _remoteStreamForPublish(streamId) {
        let remoteStream = null;
        for (let stream of this._remoteStreams.values()) {
            if (stream._publisherId === streamId) {
                remoteStream = stream;
                break;
            }
        }
        return remoteStream;
    }
}

RTCEngine.NEW = 'new';
RTCEngine.CONNECTING = 'connecting';
RTCEngine.CONNECTED = 'connected';
RTCEngine.DISCONNECTED = 'disconnected';
RTCEngine.CLOSED = 'closed';