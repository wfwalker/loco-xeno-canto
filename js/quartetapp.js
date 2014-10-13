// app.js

// TODO: add ember for quiz?

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
		gBirds.getSightings(function() {
			gBirdSongPlayers[0].chooseSightingAndPlayRandomSound($('#status0'), $('#label0'));
			gBirdSongPlayers[1].chooseSightingAndPlayRandomSound($('#status1'), $('#label1'));
			gBirdSongPlayers[2].chooseSightingAndPlayRandomSound($('#status2'), $('#label2'));
			gBirdSongPlayers[3].chooseSightingAndPlayRandomSound($('#status3'), $('#label3'));
		});
	});

	// TODO: can we play sounds backwards
	// TODO: can we incorporate the vocoder demo?

	$('#playbackRates').click(function(e) {
		console.log('RANDOMIZE PLAYBACK RATES');

		gBirdSongPlayers[0].randomizePlaybackRate();		
		gBirdSongPlayers[1].randomizePlaybackRate();		
		gBirdSongPlayers[2].randomizePlaybackRate();		
		gBirdSongPlayers[3].randomizePlaybackRate();		
	});

	$('#panners').click(function(e) {
		console.log('RANDOMIZE PANNERS');

		gBirdSongPlayers[0].randomizePanner();
		gBirdSongPlayers[1].randomizePanner();
		gBirdSongPlayers[2].randomizePanner();
		gBirdSongPlayers[3].randomizePanner();
	});

	$('#reverse').click(function(e) {
		console.log('REVERSE PLAYBACK');

		gBirdSongPlayers[0].reversePlayback();
		gBirdSongPlayers[1].reversePlayback();
		gBirdSongPlayers[2].reversePlayback();
		gBirdSongPlayers[3].reversePlayback();
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



