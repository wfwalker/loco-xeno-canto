//server.js

var express = require('express');
var url = require('url');
var http = require('http');
var https = require('https');
var request = require('request');
var bodyParser = require('body-parser');
var args = require('system').args;
var redis = require("redis")

var gRedisClient = redis.createClient();

var gCommandLineArgs = args.slice(2);

var gRealData = (gCommandLineArgs.indexOf('-test') < 0);
console.log('real data ' + gRealData);

var app = express();

var session = require('express-session');

app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true
}));

// TODO: this will cache the index.html for a day, which is bad
// TODO: but it caches the bootstrap.css for a day which is good.
app.use("/", express.static('client', {
    maxage: 86400000
}));
app.use("/js", express.static('js', {
    maxage: 86400000
}));

app.use(bodyParser({limit: '10mb'}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

// LAUNCH SERVER

var myPort = process.env.PORT || 9090;
var mHost = process.env.VCAP_APP_HOST || "127.0.0.1";

app.listen(myPort);

console.log("running " + mHost + " " + myPort);

// Routing Parameters

app.param('latin_name', function(req, resp, next, id) {
    var latin_name = req.param('latin_name')
    console.log('latin_name ' + latin_name);
    req.latin_name = latin_name;
    next();
});

app.param('saved_session_id', function(req, resp, next, id) {
    var saved_session_id = req.param('saved_session_id')
    console.log('saved_session_id ' + saved_session_id);
    req.saved_session_id = saved_session_id;
    next();
});

// Routes

app.post('/share', function (req, resp, next) {
    console.log('POST SHARE');
    console.log(req.session.id);
    resp.json([req.session.id]);

    gRedisClient.set(req.session.id, JSON.stringify(req.body), function(reply) {
        console.log('saved session for ' + req.session.id);
        console.log(reply);
    });

    console.log(req.body);
});

app.get('/saved/:saved_session_id', function(req, resp, next) {
    // respond with the saved data previously uploaded
    
    gRedisClient.get(req.saved_session_id, function(err, reply) {
        console.log('retrieved session for ' + req.saved_session_id);
        console.log(reply);
        resp.send(reply);
    });
});

app.get('/sounds/:latin_name', function(req, resp, next) {
	var urlString = 'http://www.xeno-canto.org/api/2/recordings?query=' + req.latin_name.replace(' ', '+');
	console.log('seeking recording list ' + urlString);

    if (gRealData) {
        req.pipe(request({
            uri: urlString,
            strictSSL: false
        }, function(error, response, body) {
            if (!error && response.statusCode == 200) {
                console.log('retrieved recording list OK');
            } else {
                console.log('error retrieving recording list ' + response.statusCode);
            }
        })).pipe(resp);
        console.log('seeking recording list, set up pipe');    
    } else {
        resp.json({
            recordings: [
                {
                    file: 'saw440.mp3',
                    lic: 'CC-something',
                    rec: 'recordist1',
                    loc: 'loc1'
                }
            ]
        });
    }
});

// we must proxy soundfiles, see 
// http://stackoverflow.com/questions/13958158/why-arent-safari-or-firefox-able-to-process-audio-data-from-mediaelementsource
// https://www.npmjs.org/package/request

app.use('/soundfile', function(req, resp, next) {
    var urlString = 'http://www.xeno-canto.org' + req.path;
    console.log('seeking sound file ' + urlString);

    req.pipe(request({
        uri: urlString,
        strictSSL: false
    }, function(error, response, body) {
        if (!error && response.statusCode == 200) {
            console.log('retrieved soundfile OK');
        } else {
            console.log('error retrieving soundfile ' + response.statusCode);
        }
    })).pipe(resp);

    console.log('seeking sound file set up pipe');        
});

// proxy eBird sightings as well, so we can provide fake data instead for testing and offline development

app.use('/ebird', function(req, resp, next) {
    console.log(req.query);
    var urlString = 'http://ebird.org/ws1.1/data/obs/geo/recent';
    console.log('seeking ebird sightings ' + urlString);

    if (gRealData) {
        req.pipe(request({
            uri: urlString,
            strictSSL: false,
            qs: req.query
        }, function(error, response, body) {
            console.log('error piping ebird recent sightings');
            // TODO: close response
        })).pipe(resp);
        console.log('seeking ebird sightings set up pipe');        
    } else {
        resp.json([{
            sciName: 'sciName1',
            comName: 'comName1',
            locName: 'locName1'
        }, {
            sciName: 'sciName2',
            comName: 'comName2',
            locName: 'locName2'
        }, {
            sciName: 'sciName3',
            comName: 'comName3',
            locName: 'locName3'
        }, {
            sciName: 'sciName4',
            comName: 'comName4',
            locName: 'locName4'
        }]);
    }
});


