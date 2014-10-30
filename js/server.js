//server.js

var express = require('express');
var url = require('url');
var http = require('http');
var https = require('https');
var request = require('request');
var bodyParser = require('body-parser');
var pay = require('mozpay');

var app = express();

pay.configure({
  // This is your Application Key from the Firefox Marketplace Devhub.
  mozPayKey: '3f4c79db-c558-4d4e-8e33-61bd0e02595b',
  // This is your Application Secret from the Firefox Marketplace Devhub.
  mozPaySecret: '30538c681349048c40956eb61df9c2d45ca8cf207cd5555c59a1ef39396dd269b32320ad1fe2dec5b918c781d55ddf5d',
  // This is the aud (audience) in the JWT. You only need to override this if you want to use a dev server.
  mozPayAudience: 'marketplace-dev.allizom.org',
  // This is an optional prefix to your postback/chargeback URLs.
  // For example, a postback would be available at https://yourapp/mozpay/postback with the default prefix.
  mozPayRoutePrefix: '/mozpay',
  // Set a custom payment type for JWTs. You only need to override this if
  // you're working with a non-default payment provider.
  mozPayType: 'mozilla/payments/pay/v1'
});

pay.routes(app);

pay.on('postback', function(data) {
  console.log('product ID ' + data.request.id + ' has been purchased');
  console.log('Transaction ID: ' + data.response.transactionID);
});

pay.on('chargeback', function(data) {
  console.log('product ID ' + data.request.id + ' failed');
  console.log('reason: ' + data.response.reason);
  console.log('Transaction ID: ' + data.response.transactionID);
});

express.static.mime.define({'application/x-web-app-manifest+json': ['manifest']});

// TODO: this will cache the index.html for a day, which is bad
// TODO: but it caches the bootstrap.css for a day which is good.
app.use("/", express.static('client', {
    maxage: 86400000
}));
app.use("/js", express.static('js', {
    maxage: 86400000
}));

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

app.post('/createandsign', function (req, res, next) {
    // The client code calls this to get a signed JWT object
    // representing a purchase of a specific item
    console.log('createandsign');
    console.log(req.body);

    var name = req.body.name;
    var type = req.body.type;

    var item = 'item1';
    var token = 'o' + Math.floor(Math.random() * 1000000);

    // Use the mozpay modue to create the JWT object
    var jwt = pay.request({
        id: name,
        name: name,
        description: 'description',
        icons: { '64': "http://birdwalker.com:9090/bird-64.png" },
        pricePoint: 1,
        productData: token,
        postbackURL: 'http://birdwalker.com:9090/mozpay/postback',
        chargebackURL: 'http://birdwalker.com:9090/mozpay/chargeback'
        //simulate: { 'result': 'postback' }
    });

    // Keep track of which JWT objects we are waiting on
    // TODO: purchase queue
    // purchaseQueue[token] = 'processing';

    // Send it back to the client which will be posted to the mozPay API
    res.send(JSON.stringify({
        jwt: jwt,
        token: token
    }));

});

app.post('/share', function (req, resp, next) {
    console.log('POST SHARE');
    console.log(req.body);
    resp.send('OK');
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

