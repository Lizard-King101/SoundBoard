const Lame = require('lame');
const Speaker = require('speaker');
const {getAudioDurationInSeconds} = require('get-audio-duration')
const fs = require('fs');
const path = require('path');
//const mpg123Util = require('node-mpg123-util');
var events = {};

var soundDuration = 0;
var startTime = null;
var interval = null;
var playing = null;
var intStart = true;
var volume = 1;

var decoder;
var speaker;

function stop() {
    if(events.end) {
        events.end();
    }
}

function play(sound){
    if(sound && !playing) {
        createSpeaker();
        // setVolume(volume);
        playing = sound.id;
        let soundPath = path.join(__dirname, '../', sound.path);
        console.log(sound)
        getAudioDurationInSeconds(soundPath).then((duration) => {
            soundDuration = duration * 1000;
            try{
                fs.createReadStream(soundPath)
                .pipe(decoder).pipe(speaker);
                
            } catch (e) {
                console.log(e);
            }
        })
	}
}

function startInterval() {
    intStart = true;
    interval = setInterval(() => {
        let now = new Date().getTime();
        let elapsed = now - startTime;
        if(elapsed >= soundDuration) {
            console.log('end');
            if(events.end) events.end();
            clearInterval(interval);
            stop();
            
        } else {
            let percent = 100 * elapsed / soundDuration;
            let tmp = {at: percent, playing};
            if (intStart) {
                tmp.start = true;
                intStart = false;
            }
            if(events.update) events.update(tmp);
        }
    }, 30)
}

function on(event, callback) {
    events[event] = callback;
}

function setVolume(v){
    // volume = v;
    // mpg123Util.setVolume(decoder.mh, v);
    // let vol = mpg123Util.getVolume(decoder.mh);
    // console.log(vol);
}

function createSpeaker() {
    decoder = new Lame.Decoder({
        channels: 2,
        bitDepth: 16,
        sampleRate: 44100,
        bitRate: 128,
        outSampleRate: 22050,
        mode: Lame.STEREO
    });
    speaker = new Speaker({
        channels: 2,          // 2 channels
        bitDepth: 16,         // 16-bit samples
        sampleRate: 44100     // 44,100 Hz sample rate
    });

    speaker.on('open', () => {
        startTime = new Date().getTime();
        startInterval();
    })
    
    speaker.on('flush', () => {
        playing = false;
    })
}

module.exports = {
    play,
    stop,
    on,
    setVolume
}