var express = require('express'),
		ws = require('websocket.io'),
		fs = require('fs'),
		connections = {},
		parse = require('url').parse,
		path = require('path'),
		dict = [];

function generatePassword(limit, inclNumbers) {
  var vowels = 'aeiou'.split('');
  var constonants = 'bcdfghjklmnpqrstvwxyz'.split('');
  var word = '', i, num;

  if (!limit) limit = 8;

  for (i = 0; i < (inclNumbers ? limit - 3 : limit); i++) {
    if (i % 2 == 0) { // even = vowels
      word += vowels[Math.floor(Math.random() * 4)]; 
    } else {
      word += constonants[Math.floor(Math.random() * 20)];
    } 
  }

  if (inclNumbers) {
    num = Math.floor(Math.random() * 99) + '';
    if (num.length == 1) num = '00' + num;
    else if (num.length == 2) num = '0' + num;
    word += num;
  }

  return word.substr(0, limit);
}


function loadDict() {
	fs.readFile('/usr/share/dict/words', function (err, data) {
		if (err) return;
		var words = data.toString().split(/\n/),
				length = words.length;
		for (var i = 0; i < length; i++) {
			var len = words[i].length;
			if (len > 3 && len < 8) {
				dict.push(words[i].toLowerCase());
			}
		}
		console.log('dictionary loaded: ' + dict.length + ' words');
	});
}

function removeConnection(res) {
  var i = connections[res.key].indexOf(res);
  if (i !== -1) {
    connections[res.key].splice(i, 1);
		if (connections[res.key] == 0) {
			delete connections[res.key];
		}
	}
}

function sendSSE(res, id, event, message) {
  var data = '';
  if (event) {
    data += 'event: ' + event + '\n';
  }

  // blank id resets the id counter
  if (id) {
    data += 'id: ' + id + '\n';
  } else {
    data += 'id\n';
  }

  if (message) {
    data += 'data: ' + message.split(/\n/).join('\ndata:') + '\n';
  }
  data += '\n'; // final part of message

  res.write(data);

  if (res.hasOwnProperty('xhr')) {
    clearTimeout(res.xhr);
    res.xhr = setTimeout(function () {
      res.end();
      removeConnection(res);
    }, 250);
  }
}


function routes(app) {
	app.get('XXXX/listen/:key', function (req, res) {
		var key = req.param.key;
		res.key = key;

    if (req.headers.accept == 'text/event-stream') {
      res.writeHead(200, {
        'content-type': 'text/event-stream',
        'cache-control': 'no-cache',
        'connection': 'keep-alive'
      });

      // support the polyfill
      if (req.headers['x-requested-with'] == 'XMLHttpRequest') {
        res.xhr = null;
      }

      // resets the ID
      res.write('id\n\n');

      if (!connections[key]) connections[key] = [];
      connections[key].push(res);

      req.on('close', function () {
        removeConnection(res);
      });
    } else {
      // arbitrarily redirect them away from this url
      res.writeHead(302, { location: "/" });
      res.end();
    }
  });
}

var app = express.createServer();

app.configure(function () {
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.static(__dirname + '/public'));
	app.use(app.router);
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});

app.listen(process.env.PORT || process.argv[2] || 8000);

// routes
app.get('/', function (req, res) {
  res.render('index');
});

app.post('/register', function (req, res) {
  console.log(req.body);
  res.render('remote', {
    key: req.body.key
  });
});

app.get('/getkey', function (req, res) {
  var key = '';
  for (var i = 0; i < 10; i++) { // try 10 times, then make it up
    key = dict[dict.length * Math.random() | 0];
    if (!connections[key]) break;
    key = ''; // nasty
  }

  if (!key) key = generatePassword(5); // chance of being in use? less than testing

  // send as json
  res.writeHead(200, { 
    'Content-Type' : 'application/json',
    'Access-Control-Allow-Origin': '*' // we love you all
  });
  console.log('generated key: ' + key);
  res.end(JSON.stringify({ key: key }));
});


var server = ws.attach(app),
		LISTEN = 1,
		SERVE = 2;

server.on('connection', function (socket) {
	var url = parse(socket.req.url);
	console.log(url);
	var key = path.basename(url.pathname),
			type = LISTEN;
	
	if (url.pathname.indexOf('/listen/') === 0) {
		if (!connections[key]) connections[key] = [];
		connections[key].push(socket);
	} else if (url.pathname.indexOf('/serve/') === 0) {
		type = SERVE;
	}

	console.log((type == LISTEN ? 'Listening on ' : 'Serving ') + key);

	socket.on('message', function (message) {
		if (type == SERVE) {
			// broadcast to listen sockets on the same key
			if (connections[key] && connections[key].length) {
				connections[key].forEach(function (socket) {
					socket.send(message);
				});
			}
		}
	});
	socket.on('close', function () {
    if (connections[key]) {
      var i = connections[key].indexOf(socket);
      if (i !== -1) {
        connections[key].splice(i, 1);
        if (connections[key] == 0) {
          delete connections[key];
        }
      } 
    }
	});
});

loadDict();

console.log('%s mode listening on http://' + app.address().address + ':' + app.address().port, app.settings.env);


/*
if popup can't open, offer to create connection to remote-tilt.com

if agree - connect an eventsource session given a particular key

server: prompt for key
if key matches a sesssion, offer up the remote control
and send message to session 

*/