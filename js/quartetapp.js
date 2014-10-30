// app.js

var payment_providers = [
	{
		'type': 'mozilla/payments/pay/v1',
		'uri': 'https://marketplace-dev.allizom.org/mozpay/?req=',
	}
];
 
if (navigator.mozPay == null) {
	var mozPay = function(item) {
		var parsed = jwt.WebTokenParser.parse(item);
		console.log('parsed');
		console.log(parsed);
		var decoded = JSON.parse(jwt.base64urldecode(parsed.payloadSegment));
		console.log('decoded');
		console.log(decoded);
		for (var k = 0; k < payment_providers.length; k++) {
			if (payment_providers[k].type === decoded.typ) {
				console.log('Redirecting...');
				window.open(payment_providers[k].uri + item, '_blank');
			} else {
				console.log('not redirecting');
			}
		}
	};
 
	var mozPaymentProvider = {
		mcc: 1,
		mnc: 2,
		paymentSuccess: function() {
			console.log('shim mozPaymentProvider.paymentSuccess');
		},
		paymentFailure: function() {
			console.log('shim mozPaymentProvider.paymentFailure');
		}
	};
	 
	navigator.mozPay = mozPay;
	window.mozPaymentProvider = mozPaymentProvider;
}

// Begin a purchase. Typically you would attach this to the click handler on a Buy button.
// purchaseSomething("A nice unicorn");

function purchaseSomething(inProductID) {
	console.log('starting purchaseSomething ' + inProductID);

	$.ajax({
		type: 'POST',
		url: '/createandsign',
		dataType: 'json',
		data: { name: inProductID, type: 'thing' }, /* TODO: productID goes in here */
		success: function(data) {
			if (data) {
				console.log('succeed');
				console.log(data);

			    // Pass the JSON Web Tokens to the payment provider
			    var request = navigator.mozPay(data.jwt);

			    // Set up the success/error handler for the payment window.
			    request.onsuccess = function () {
			      console.log('The user payment flow completed successfully');
			      // Although the payment flow completed, you need to poll your server and wait 
			      // for a verified payment result to be sure the payment went through.
			      waitForPaymentResult(data.transactionID);
			    };
			    request.onerror = function () {
			      console.log('Sorry, the payment flow had an error:', this.error.name);
			    };
			} else {
				console.log('fail');
				console.log(data);
			}
		}.bind(this),
		error: function(xhr, status, error) {
			console.log('fail');
			console.log(error);
		}
	});		
}

function waitForPaymentResult(transactionID) {
  var myXHR = new XMLHttpRequest();
  myXHR.responseType = 'json';

  // Prepare to check if a postback/chargeback has been received for transactionID.
  myXHR.open('GET', '/payment_result/' + transactionID);

  myXHR.addEventListener('load', function () {
    // Retrieve the result, such as:
    // {"result": "postback received"} or {"result": "still waiting"}
    if (myXHR.response.result == 'postback received') {
      // A postback notice was received and you verified the incoming JWT signature.
      console.log('Success! The product has been purchased');
    } else {
      // No postback/chargeback has been sent to your server yet. Try again in 3 seconds.
      window.setTimeout(function() { waitForPaymentResult(transactionID); }, 3000);
    }
  });

  // Send the request to check the transactionID status.
  myXHR.send();
}


// TODO: add ember for quiz?

// TODO: http://www.tulane.edu/~rscheidt/rcc_calendar.html ?
// TODO: http://freemusicarchive.org/api ?

var gBirds = new PlaceTimeBirdSongs();

	// GLOBAL initialize audio context and listener
window.AudioContext = window.AudioContext||window.webkitAudioContext;
var gAudioContext = new AudioContext();
var gListener = gAudioContext.listener;
gListener.dopplerFactor = 1;
gListener.speedOfSound = 343.3;
gListener.setOrientation(0,0,-1,0,1,0);

// GLOBAL sound sources for bird song playback
gBirdSongPlayers = [];
gBirdSongPlayers[0] = new BirdSongPlayer(gAudioContext, 'volumeMeter0');
gBirdSongPlayers[1] = new BirdSongPlayer(gAudioContext, 'volumeMeter1');
gBirdSongPlayers[2] = new BirdSongPlayer(gAudioContext, 'volumeMeter2');
gBirdSongPlayers[3] = new BirdSongPlayer(gAudioContext, 'volumeMeter3');

$(document).ready(function(){ 
	// gBirds.setLocation({ coords: { latitude: 37, longitude: -122 }}, function(position) {
	// 	$('#position').text(Math.round(position.coords.latitude * 100) / 100.0 + ', ' + Math.round(position.coords.longitude * 100) / 100.0);

	// 	gBirds.getSightings(function() {
	// 		for (var i = 0; i < gBirdSongPlayers.length; i++) {
	// 			gBirdSongPlayers[i].chooseSightingAndPlayRandomSound('#player' + i);
	// 		}
	// 	});
	// });

	// TODO: can we incorporate the vocoder demo?

	$('#playbackRates').click(function(e) {
		console.log('RANDOMIZE PLAYBACK RATES');

		for (var i = 0; i < gBirdSongPlayers.length; i++) {
			gBirdSongPlayers[i].randomizePlaybackRate('#player' + i);
		}
	});

	$('#panners').click(function(e) {
		console.log('RANDOMIZE PANNERS');

		for (var i = 0; i < gBirdSongPlayers.length; i++) {
			gBirdSongPlayers[i].randomizePanner('#player' + i);
		}
	});

	$('#reverse').click(function(e) {
		console.log('REVERSE PLAYBACK');

		for (var i = 0; i < gBirdSongPlayers.length; i++) {
			gBirdSongPlayers[i].reversePlayback('#player' + i);
		}
	});

	$('#share').click(function(e) {
		console.log('SHARE');

		$.post(
			"/share", 
			JSON.stringify( gBirdSongPlayers[0] ), 
			function(data, status) {
				console.log('success sharing');
			},
			'json');		
	});

	$('#recording0').click(function(e) {
		gBirdSongPlayers[0].chooseRandomRecording('#player0');
	});
	$('#recording1').click(function(e) {
		gBirdSongPlayers[1].chooseRandomRecording('#player1');
	});
	$('#recording2').click(function(e) {
		gBirdSongPlayers[2].chooseRandomRecording('#player2');
	});
	$('#recording3').click(function(e) {
		gBirdSongPlayers[3].chooseRandomRecording('#player3');
	});

	$('#nextSighting0').click(function(e) {
		gBirdSongPlayers[0].chooseSightingAndPlayRandomSound('#player0');
	});
	$('#nextSighting1').click(function(e) {
		gBirdSongPlayers[1].chooseSightingAndPlayRandomSound('#player1');
	});
	$('#nextSighting2').click(function(e) {
		gBirdSongPlayers[2].chooseSightingAndPlayRandomSound('#player2');
	});
	$('#nextSighting3').click(function(e) {
		gBirdSongPlayers[3].chooseSightingAndPlayRandomSound('#player3');
	});

	$('#buy').click(function(e) {
		purchaseSomething('my product ID');
	});
});



