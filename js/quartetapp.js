// app.js

// ‘Anything … may happen. A “mistake” is beside the point, for once anything happens it authentically is.’
//   from:
// ‘Composition: To Describe the Process of Composition Used in Music of Changes and Imaginary Landscape No. 4’
// Silence, 1961

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
	gBirds.setLocation({ coords: { latitude: 37, longitude: -122 }}, function(position) {
		$('#position').text(position.coords.latitude + ', ' + position.coords.longitude);
		gBirds.getSightings(function() {
			for (var i = 0; i < gBirdSongPlayers.length; i++) {
				gBirdSongPlayers[i].chooseSightingAndPlayRandomSound('#player' + i);
			}
		});
	});

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
});



