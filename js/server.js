//server.js

var express = require('express');
var url = require('url');
var http = require('http');
var https = require('https');
var request = require('request');

var app = express();

app.use("/", express.static('client'));
app.use("/js", express.static('js'));

// LAUNCH SERVER

var myPort = process.env.PORT || 8080;
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
	var urlString = 'http://www.xeno-canto.org/api/2/recordings?callback=pants&query=' + req.latin_name.replace(' ', '+');
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
