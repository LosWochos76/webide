var express = require('express');
var app = express();
var expressWs = require('express-ws')(app);
var os = require('os');
var pty = require('pty.js');
var bodyParser = require('body-parser');
var fs = require('fs');

var terminals = {};
var logs = {};

app.use(express.static(__dirname + '/public'));

// the xterm.js sources
app.use(express.static(__dirname + '/node_modules/xterm/dist'));

// the ace-editor
app.use(express.static(__dirname + '/node_modules/ace-builds/src-min-noconflict'));

app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());

app.post('/terminals', function (req, res) {
	var cols = parseInt(req.query.cols),
		rows = parseInt(req.query.rows),
		term = pty.spawn('/bin/bash', [], {
		name: 'xterm-color',
		cols: cols || 80,
		rows: rows || 24,
		cwd: process.env.PWD,
		env: process.env
	});

	console.log('Created terminal with PID: ' + term.pid);
	terminals[term.pid] = term;
	logs[term.pid] = '';
	
	if (!fs.existsSync(__dirname + '/compile'))
		fs.mkdirSync(__dirname + '/compile');
		
	if (!fs.existsSync(__dirname + '/compile' + term.pid))
		fs.mkdirSync(__dirname + '/compile/' + term.pid);

	term.write("cd compile/" + term.pid + "\n");

	term.on('data', function(data) {
		logs[term.pid] += data;
	});

	res.send(term.pid.toString());
	res.end();
});

app.ws('/terminals/:pid', function (ws, req) {
	var term = terminals[parseInt(req.params.pid)];
	console.log('Connected to terminal ' + term.pid);
	//ws.send(logs[term.pid]);

	term.on('data', function(data) {
		try {
		  ws.send(data);
		} catch (ex) {
		  // The WebSocket is not open, ignore
		}
	});
	
	ws.on('message', function(msg) {
		term.write(msg);
	});
	
	ws.on('close', function () {
		process.kill(term.pid);
		console.log('Closed terminal ' + term.pid);
		delete terminals[term.pid];
		delete logs[term.pid];
	});

	term.write("\n");

	
});

app.post('/compile/:pid', function(req, res) {
	console.log("Compile at " + req.params.pid);
	var term = terminals[parseInt(req.params.pid)];
	term.write("g++ main.cpp\n");
	res.send("Ok");
	res.end();
});

app.post('/run/:pid', function(req, res) {
	console.log("Run at " + req.params.pid);
	var term = terminals[parseInt(req.params.pid)];
	term.write("./a.out\n");
	res.send("Ok");
	res.end();
});

app.post('/upload/:pid', function(req, res) {
	console.log('Upload to ' + req.params.pid);
	var term = terminals[parseInt(req.params.pid)];
	var stream = fs.createWriteStream(__dirname + '/compile/' + req.params.pid + '/' + req.body.file);
	stream.once('open', function(fs) {
	  stream.write(req.body.code);
	  stream.end();
	});

	res.send("Ok");
	res.end();
});

app.get('/download/:pid', function(req, res) {
	console.log('Download from ' + req.params.pid);
	var file = __dirname + '/compile/' + req.params.pid + '/main.cpp';
	/*fs.stat(file, function(err, stat) {
		if (err) {
			res.status(404).send("Not found");
			res.end();
		} else {
			res.sendFile(file);
		}
	});*/
});

var port = process.env.PORT || 3000,
    host = os.platform() === 'win32' ? '127.0.0.1' : '0.0.0.0';

console.log('App listening to http://' + host + ':' + port);
app.listen(port, host);