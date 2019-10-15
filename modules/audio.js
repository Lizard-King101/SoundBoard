const Lame = require('lame');
const Gain = require('audio-gain');
const Speaker = require('speaker');
const mp3Duration = require('mp3-duration');
const fs = require('fs');
const path = require('path');
var events = {};

var soundDuration = 0;
var startTime = null;
var interval = null;
var playing = null;
var intStart = true;
var volume = 1;

var decoder;
var gain;
var speaker;

function stop() {
    if(events.end) {
        events.end();
    }
}

function play(sound){
    if(sound && !playing) {
        createSpeaker();
        playing = sound.id;
        let soundPath = path.join(__dirname, '../', sound.path);
        console.log(sound)
        mp3Duration(soundPath, (err, duration) => {
            soundDuration = duration * 1000;
            try{
                fs.createReadStream(soundPath)
                .pipe(decoder)
                //.pipe(gain)
                .pipe(speaker);
                
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
    volume = v;
    // console.log('Audio Volume: '+v);
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
    gain = Gain(volume);
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
