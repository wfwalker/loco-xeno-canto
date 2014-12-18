//server.js

var express = require('express');
var url = require('url');
var http = require('http');
var https = require('https');
var request = require('request');
var bodyParser = require('body-parser');
var args = require('system').args;

var gCommandLineArgs = args.slice(2);

var gSavedQuartets = {};

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

app.use(bodyParser({limit: '100mb'}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

// LAUNCH SERVER

var myPort = process.env.PORT || 9090;
var mHost = process.env.VCAP_APP_HOST || "127.0.0.1";

app.listen(myPort);

console.log("running " + mHost + " " + myPort);

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

app.post('/share', function (req, resp, next) {
    console.log('POST SHARE');
    console.log(req.session.id);
    resp.json([req.session.id]);
    gSavedQuartets[req.session.id] = req.body;

    console.log(req.body);
});

app.get('/saved/:saved_session_id', function(req, resp, next) {
    // respond with the saved data previously uploaded
    if (gSavedQuartets[req.saved_session_id]) {
        resp.json(gSavedQuartets[req.saved_session_id]);
    } else {
        resp.json({});
    }
});

app.get('/sounds/:latin_name', function(req, resp, next) {
	var urlString = 'http://www.xeno-canto.org/api/2/recordings?query=' + req.latin_name.replace(' ', '+');
	console.log('seeking sound data ' + urlString);

    if (gRealData) {
        req.pipe(request({ uri: urlString, strictSSL: false })).pipe(resp);
        console.log('seeking sound data set up pipe');        
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
    // TODO: wrapping the call to pipe() in try/catch does not catch this error:

    // Error: getaddrinfo ENOTFOUND
    //     at errnoException (dns.js:37:11)
    //     at Object.onanswer [as oncomplete] (dns.js:124:16)

    var urlString = 'http://www.xeno-canto.org' + req.path;
    console.log('seeking sound file ' + urlString);

    req.pipe(request({ uri: urlString, strictSSL: false })).pipe(resp);
    console.log('seeking sound file set up pipe');        
});

app.use('/ebird', function(req, resp, next) {
    console.log(req.query);
    var urlString = 'http://ebird.org/ws1.1/data/obs/geo/recent';
    console.log('seeking ebird sightings ' + urlString);

    if (gRealData) {
        req.pipe(request({ uri: urlString, strictSSL: false, qs: req.query })).pipe(resp);
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


