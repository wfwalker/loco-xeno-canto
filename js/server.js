//server.js

var express = require('express');
var url = require('url');
var http = require('http');
var https = require('https');
var request = require('request');

var app = express();

// TODO: this will cache the index.html for a day, which is bad
// TODO: but it caches the bootstrap.css for a day which is good.
app.use("/", express.static('client', {
    maxage: 86400000
}));
app.use("/js", express.static('js', {
    maxage: 86400000
}));

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

app.get('/sounds/:latin_name', function(req, resp, next) {
	var urlString = 'http://www.xeno-canto.org/api/2/recordings?query=' + req.latin_name.replace(' ', '+');
	console.log('seeking sound data ' + urlString);

    request({ uri: urlString, strictSSL: false }, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            try {
                resp.json(JSON.parse(body.trim()));
            }
            catch (e) {
                console.log('cannot parse ' + inURL + ', ' + e);
            }
        } else {
            console.log('cannot retrieve ' + inURL + ', ' + error);
        }
    });
});

// we must proxy soundfiles, see 
// http://stackoverflow.com/questions/13958158/why-arent-safari-or-firefox-able-to-process-audio-data-from-mediaelementsource
// https://www.npmjs.org/package/request

app.use('/soundfile', function(req, resp, next) {
    var urlString = 'http://www.xeno-canto.org' + req.path;
    console.log('seeking sound file ' + urlString);
    req.pipe(request({ uri: urlString, strictSSL: false })).pipe(resp);
    console.log('seeking sound file set up pipe');
});

