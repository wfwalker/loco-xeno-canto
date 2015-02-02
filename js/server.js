//server.js

var express = require('express');
var url = require('url');
var http = require('http');
var https = require('https');
var request = require('request');
var progress = require('request-progress');
var bodyParser = require('body-parser');
var args = require('system').args;
var fs = require('fs');

// increase maximum simultaneous sockets
http.globalAgent.maxSockets = 500;
https.globalAgent.maxSockets = 500;

// set up logging
var winston = require('winston');
var logger = new (winston.Logger)({
    transports: [
        // TODO: only show debug logs if this is dev server
        new (winston.transports.Console)({ level: 'info' }),
        new (winston.transports.File)({ filename: 'oiseaux.log' })
    ]
});

// connect to database
var redis = require("redis");
var gRedisClient = redis.createClient();

// parse commandline arguments
var gCommandLineArgs = args.slice(2);

// support for reading fake data from a JSON file
var gRealData = (gCommandLineArgs.indexOf('-test') < 0);
var gFakeData = {};
var gSciNameToRecordings = {};

logger.info('use real sighting and recording data: ' + gRealData);

if (! gRealData) {
    var filename = gCommandLineArgs[gCommandLineArgs.indexOf('-test') + 1];

    fs.readFile(filename, 'utf8', function (err,data) {
        if (err) {
            return console.log(err);
        }
        gFakeData = JSON.parse(data);

        for (var index = 0; index < gFakeData.savedPlayer.length; index++) {
            var savedPlayer = gFakeData.savedPlayer[index];
            gSciNameToRecordings[savedPlayer.sighting.sciName] = [ savedPlayer.recording ];
        }
        logger.info(gSciNameToRecordings);
    });
}

// set up server
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

logger.info("running " + mHost + " " + myPort);

// Routing Parameters

app.param('latin_name', function(req, resp, next, id) {
    var latin_name = req.param('latin_name')
    logger.debug('latin_name', latin_name);
    req.latin_name = latin_name;
    next();
});

app.param('saved_session_id', function(req, resp, next, id) {
    var saved_session_id = req.param('saved_session_id')
    logger.debug('saved_session_id', saved_session_id);
    req.saved_session_id = saved_session_id;
    next();
});

// Routes

app.post('/share', function (req, resp, next) {
    logger.info('receiving shared session', req.session.id);
    resp.json([req.session.id]);

    gRedisClient.set(req.session.id, JSON.stringify(req.body), function(reply) {
        logger.info('saved session', req.session.id);
        logger.debug(reply);
    });

    logger.debug(req.body);
});

function makeSetDescriptionFunction(inKey) {
    return function(keyError, keyReply){
        logger.debug('inKey ' + inKey, JSON.parse(keyReply)); 
    }
}

function pipeRequest(inReq, inResp, inURLString) {
    logger.info('seeking', inURLString);

    inReq.pipe(progress(request({
        uri: inURLString,
        qs: inReq.query,
        strictSSL: false
    }, function(error, response, body) {
        if (!error && response.statusCode == 200) {
            logger.info('success', inURLString);
        } else {
            // something went wrong
            logger.info('error', inURLString);

            if (response.headers['content-length'] > 0) {
                logger.error('CONTENT LENGTH NONZERO');
            } else {
                inResp.sendStatus(500);
            }
        }
    }), {
        throttle: 200,
        delay: 100
    })).on('close', function(error) {
        logger.info('closed ' + inURLString);
    }).on('progress', function(state) {
        logger.debug(inURLString, state);
    }).pipe(inResp);
    
    logger.debug('set up pipe for', inURLString);
}

// retrieve a list of all the saved sessions
app.get('/saved', function(req, resp, next) {
    var listOfSavedSessions = [];

    gRedisClient.keys('*', function (err, keys) {
        if (err) return logger.error(err);

        for(var i = 0, len = keys.length; i < len; i++) {
            listOfSavedSessions.push(keys[i]);
        }

        for(var i = 0, len = keys.length; i < len; i++) {
            var myKey = listOfSavedSessions[i];
            gRedisClient.get(myKey, makeSetDescriptionFunction(myKey));
        }

        resp.json(listOfSavedSessions);
    });
});

app.get('/saved/:saved_session_id', function(req, resp, next) {
    // respond with the saved data previously uploaded
    
    gRedisClient.get(req.saved_session_id, function(err, reply) {
        logger.info('retrieved session', req.saved_session_id);
        logger.debug(reply);
        resp.send(reply);
    });
});

app.get('/sounds/:latin_name', function(req, resp, next) {
	var urlString = 'http://www.xeno-canto.org/api/2/recordings?query=' + req.latin_name.replace(' ', '+');

    if (gRealData) {
        pipeRequest(req, resp, urlString);  
    } else {
        var sciName = req.latin_name.replace('+', ' ');

        if (gSciNameToRecordings[sciName]) {
            logger.debug('RESPONSE', gSciNameToRecordings[sciName]);
            resp.json({"recordings": gSciNameToRecordings[sciName]});
        } else {
            throw "missing fake data for " + sciName;
        }
    }
});

app.get('/photos/:latin_name', function(req, resp, next) {
    var urlString = 'http://birdwalker.com/taxons/latin/' + req.latin_name.replace(' ', '%20') + '.json';

    if (gRealData) {
        pipeRequest(req, resp, urlString);      
    } else {
        // TODO: need fake photo data
        resp.json({});
    }
});

// we must proxy soundfiles, see 
// http://stackoverflow.com/questions/13958158/why-arent-safari-or-firefox-able-to-process-audio-data-from-mediaelementsource
// https://www.npmjs.org/package/request

app.use('/soundfile', function(req, resp, next) {
    var urlString = 'http://www.xeno-canto.org' + req.path;
    pipeRequest(req, resp, urlString);  
});

// proxy eBird sightings as well, so we can provide fake data instead for testing and offline development

app.use('/ebird', function(req, resp, next) {
    logger.debug('DEBUG', req.query);

    if (gRealData) {
        var urlString = 'http://ebird.org/ws1.1/data/obs/geo/recent';
        pipeRequest(req, resp, urlString);  
    } else {
        resp.json([
            gFakeData.savedPlayer[0].sighting,
            gFakeData.savedPlayer[1].sighting,
            gFakeData.savedPlayer[2].sighting,
            gFakeData.savedPlayer[3].sighting
        ]);
    }
});
