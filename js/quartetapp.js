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
gBirdSongPlayers[0] = new BirdSongPlayer(gAudioContext);
gBirdSongPlayers[1] = new BirdSongPlayer(gAudioContext);
gBirdSongPlayers[2] = new BirdSongPlayer(gAudioContext);
gBirdSongPlayers[3] = new BirdSongPlayer(gAudioContext);

$(document).ready(function(){ 
	gBirds.setLocation({ coords: { latitude: 37, longitude: -122 }}, function(position) {
		$('#position').text(position.coords.latitude + ', ' + position.coords.longitude);
		gBirds.getSightings(function() {
			for (var i = 0; i < gBirdSongPlayers.length; i++) {
				gBirdSongPlayers[i].chooseSightingAndPlayRandomSound($('#sighting' + i), $('#status' + i), $('#label' + i));
			}
		});
	});

	// TODO: can we incorporate the vocoder demo?

	$('#playbackRates').click(function(e) {
		console.log('RANDOMIZE PLAYBACK RATES');

		for (var i = 0; i < gBirdSongPlayers.length; i++) {
			gBirdSongPlayers[i].randomizePlaybackRate();
		}
	});

	$('#panners').click(function(e) {
		console.log('RANDOMIZE PANNERS');

		for (var i = 0; i < gBirdSongPlayers.length; i++) {
			gBirdSongPlayers[i].randomizePanner();
		}
	});

	$('#reverse').click(function(e) {
		console.log('REVERSE PLAYBACK');

		for (var i = 0; i < gBirdSongPlayers.length; i++) {
			gBirdSongPlayers[i].reversePlayback();
		}
	});

	$('#recording0').click(function(e) {
		gBirdSongPlayers[0].chooseRandomRecording($('#sighting0'), $('#status0'), $('#label0'));
	});
	$('#recording1').click(function(e) {
		gBirdSongPlayers[1].chooseRandomRecording($('#sighting1'), $('#status1'), $('#label1'));
	});
	$('#recording2').click(function(e) {
		gBirdSongPlayers[2].chooseRandomRecording($('#sighting2'), $('#status2'), $('#label2'));
	});
	$('#recording3').click(function(e) {
		gBirdSongPlayers[3].chooseRandomRecording($('#sighting3'), $('#status3'), $('#label3'));
	});

	$('#toggle0').click(function(e) {
		gBirdSongPlayers[0].toggleMute();
	});
	$('#toggle1').click(function(e) {
		gBirdSongPlayers[1].toggleMute();
	});
	$('#toggle2').click(function(e) {
		gBirdSongPlayers[2].toggleMute();
	});
	$('#toggle3').click(function(e) {
		gBirdSongPlayers[3].toggleMute();
	});

	$('#nextSighting0').click(function(e) {
		gBirdSongPlayers[0].chooseSightingAndPlayRandomSound($('#sighting0'), $('#status0'), $('#label0'));
	});
	$('#nextSighting1').click(function(e) {
		gBirdSongPlayers[1].chooseSightingAndPlayRandomSound($('#sighting1'), $('#status1'), $('#label1'));
	});
	$('#nextSighting2').click(function(e) {
		gBirdSongPlayers[2].chooseSightingAndPlayRandomSound($('#sighting2'), $('#status2'), $('#label2'));
	});
	$('#nextSighting3').click(function(e) {
		gBirdSongPlayers[3].chooseSightingAndPlayRandomSound($('#sighting3'), $('#status3'), $('#label3'));
	});


	window.setInterval(function() {
		for (var i = 0; i < 4; i++) {
			if (gBirdSongPlayers[i].soundSource) {
				$('#playbackRate' + i).text((Math.round(100 * gBirdSongPlayers[i].soundSource.playbackRate.value) / 100.0) + "x");
			}
		}

		$('#clock').text(Math.round(gAudioContext.currentTime) + 's');
	}, 1000);

});



