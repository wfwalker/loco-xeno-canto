//server.js

var express = require('express');
var url = require('url');
var http = require('http');
var request = require('request');
var bodyParser = require('body-parser');

// set up logging
var winston = require('winston');
var logger = new (winston.Logger)({
    transports: [
        new (winston.transports.Console)(),
        new (winston.transports.File)({ filename: 'oiseaux.log' })
    ]
});

// Increase maximum outgoing HTTP connections
// See: http://nodejs.org/api/http.html#http_class_http_agent
http.globalAgent.maxSockets = 500;


// connect to database
var redis = require("redis");
var gRedisClient = redis.createClient();

// parse commandline arguments
var gCommandLineArgs = process.argv.slice(2);

var gRealData = (gCommandLineArgs.indexOf('-test') < 0);
logger.info('use real sighting and recording data: ' + gRealData);

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
app.use("/", express.static('static', {
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
    logger.debug('latin_name ' + latin_name);
    req.latin_name = latin_name;
    next();
});

app.param('saved_session_id', function(req, resp, next, id) {
    var saved_session_id = req.param('saved_session_id')
    logger.debug('saved_session_id ' + saved_session_id);
    req.saved_session_id = saved_session_id;
    next();
});

// Routes

app.post('/share', function (req, resp, next) {
    logger.info('receiving shared session: ' + req.session.id);
    resp.json([req.session.id]);

    gRedisClient.set(req.session.id, JSON.stringify(req.body), function(reply) {
        logger.info('saved session for ' + req.session.id);
        logger.debug(reply);
    });

    logger.debug(req.body);
});

app.get('/saved', function(req, resp, next) {
    var listOfSavedSessions = [];

    gRedisClient.keys('*', function (err, keys) {
        if (err) return logger.error(err);

        for(var i = 0, len = keys.length; i < len; i++) {
            listOfSavedSessions.push(keys[i]);
        }

        resp.json(listOfSavedSessions);
    });
});

app.get('/saved/:saved_session_id', function(req, resp, next) {
    // respond with the saved data previously uploaded
    
    gRedisClient.get(req.saved_session_id, function(err, reply) {
        logger.info('retrieved session for ' + req.saved_session_id);
        logger.debug(reply);
        resp.send(reply);
    });
});

app.get('/sounds/:latin_name', function(req, resp, next) {
	var urlString = 'http://www.xeno-canto.org/api/2/recordings?query=' + req.latin_name.replace(' ', '+');
	logger.info('seeking recording list ' + urlString);

    if (gRealData) {
        req.pipe(request({
            uri: urlString,
            strictSSL: false
        }, function(error, response, body) {
            if (!error && response.statusCode == 200) {
                logger.debug('retrieved recording list OK');
            } else {
                logger.debug('error retrieving recording list ' + response.statusCode);
            }
        })).pipe(resp);
        logger.debug('seeking recording list, set up pipe');    
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
    logger.info('seeking sound file ' + urlString);

    req.pipe(request({
        uri: urlString,
        strictSSL: false
    }, function(error, response, body) {
        if (!error && response.statusCode == 200) {
            logger.debug('retrieved soundfile OK');
        } else {
            logger.error('error retrieving soundfile ' + response.statusCode);
        }
    })).pipe(resp);

    logger.debug('seeking sound file set up pipe');        
});

// proxy eBird sightings as well, so we can provide fake data instead for testing and offline development

app.use('/ebird', function(req, resp, next) {
    logger.debug(req.query);
    var urlString = 'http://ebird.org/ws1.1/data/obs/geo/recent';
    logger.info('seeking ebird sightings', req.query);

    if (gRealData) {
        req.pipe(request({
            uri: urlString,
            strictSSL: false,
            qs: req.query
        }, function(error, response, body) {
            if (!error && response.statusCode == 200) {
                logger.debug('piping recording list OK');
            } else {
                logger.error('error piping ebird recent sightings' + response.statusCode);
            }
        })).pipe(resp);
        logger.debug('seeking ebird sightings set up pipe');        
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


