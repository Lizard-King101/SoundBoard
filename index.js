// REQUIRES
const express = require('express');
const path = require('path');
const app = express();
const http = require('http').createServer(app);
const bodyParser = require('body-parser');
const bonjour = require('bonjour')();
const fs = require('fs');
const formidable = require('formidable');
const io = require('socket.io')(http);
const audio = require('./modules/audio');

var sounds = [];
var volume = 1;

audio.on('update', (data)=>{
	io.emit('playing-update', data);
});

audio.on('end', () => {
	io.emit('playing-end');
});

// CONFIG
app.set('port', process.env.PORT || 80);
app.use('/sounds', express.static(path.join(__dirname, 'sounds')));
app.use('/', express.static(path.join(__dirname, 'www')));

app.use(bodyParser.urlencoded({ extended: false }))
// parse application/json
app.use(bodyParser.json())

// ROUTES
// Render the app view
app.get('*', function(req, res) {
	res.sendFile(path.join(__dirname, 'www/index.html'));
});

if(!app.get('port')) bonjour.publish({ name: 'Sound Board', host: 'soundboard.local', type: 'rfb', port: app.get('port') })
// const browser = bonjour.find(
// 	{}, 
// 	(service)=>{if((['soundboard.local']).indexOf(service.host) >= 0) console.log(service);});


// post handle
app.post('*', (req, res) => {
    var urlArr = req.originalUrl.replace(/^(\/)/, '').split('/');
    var GET = false;

    if(req.originalUrl.split('?').length > 1){
        GET = {};
        req.originalUrl.split('?')[1].split('&').forEach((keyVal)=>{
            let splitKey = keyVal.split('=');
            GET[splitKey[0]] = !isNaN(splitKey[1]) ? Number(splitKey[1]) : decodeURI(splitKey[1]);
        });
    }
    var POST = req._body ? req.body : false;
	const action = urlArr[0];
	console.log(action);

	if(action == 'save_sound'){
		var form = new formidable.IncomingForm();
		form.parse(req, function(err, fields, files) {
			let soundFile = files['sound'];
			let id = Math.random().toString(36).substr(2, 9);
			let filePath = path.join(__dirname, 'sounds', id + '.' + soundFile.name.split('.').pop());
			let dest = fs.createWriteStream(filePath);
			let tmp = {
				id,
				name: fields.name,
				path: 'sounds/'+ id + '.' + soundFile.name.split('.').pop(),
				img: '',
				played: 0
			};
			fs.createReadStream(soundFile.path).pipe(dest);
			sounds.push(tmp);
			saveJson(sounds);
			io.emit('sounds-update', {action: 'upload'});
			res.send( {ok: true});
		});
	}

	if (action == 'delete_sound') {
		if(POST.id) {
			sounds.forEach((sound, i) => {
				if(sound.id == POST.id){
					fs.unlink(path.join(__dirname, sound.path), (err) => {
						sounds.splice(i,1);
						saveJson(sounds).then(() => {
							io.emit('sounds-update', {action: 'delete'});
						});
					})
				}
			})
		}
	}

	if(action == 'get_sounds') {
		loadJson().then((data) => {
			sounds = data;
			res.send(sounds);
		})
	}
})

io.on('connection', function (socket) {
	console.log('user connected');
	socket.emit('volume', {id: 'nobody', volume});

	socket.on('volume-set', (data)=>{
		volume = data.volume;
		audio.setVolume(data.volume);
		let tmp = {
			id: socket.id,
			volume: volume
		};
		
		io.emit('volume', tmp);
	})

	socket.on('play', (data) => {
		audio.stop();
		sounds.filter(sound => sound.id === data.id)[0].played ++;
		saveJson(sounds);
		audio.play(sounds.filter(sound => sound.id === data.id)[0]);
	})
});

// SERVER
http.listen(app.get('port'), function() {
	console.log("Server started on :" + app.get('port'));
});

loadJson().then((data) => {
	if(data) sounds = data;
	//audio.play('oz90gi3q2');
	//setTimeout(()=>{audio.stop()}, 5000)
});

function saveJson(sounds) {
	return new Promise(res => {
		let data = JSON.stringify(sounds);
		fs.writeFile(path.join(__dirname, 'sounds/sounds.json'), data, (err) => {
			if(err) res(err);
			else res({ok: true});
		});
	})
}

function loadJson() {
	return new Promise((res) => {
		fs.readFile(path.join(__dirname, 'sounds/sounds.json') , {encoding: 'utf8'}, (err, data) => {
			if(err){
				saveJson(JSON.stringify({}));
				res({});
			}
			res(data ? JSON.parse(data) : null);
		})
	})
}
