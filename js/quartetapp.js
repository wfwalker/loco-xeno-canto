// app.js

// TODO: error handling for bogus sciName (throw exception?)
// TODO: add ember for quiz?
// TODO: real object for sound library

var gBirds = new PlaceTimeBirdSongs();

// GLOBAL initialize audio context
window.AudioContext = window.AudioContext||window.webkitAudioContext;
var audioContext = new AudioContext();

var listener = audioContext.listener;
listener.dopplerFactor = 1;
listener.speedOfSound = 343.3;
listener.setOrientation(0,0,-1,0,1,0);

// TODO can we mess with playback rate
// https://developer.mozilla.org/en-US/Apps/Build/Audio_and_video_delivery/HTML5_playbackRate_explained

function wireUpNodes(inIndex) {
	var source = audioContext.createMediaElementSource($('audio')[inIndex]);

	var gainNode = audioContext.createGain();
	gainNode.gain.value = 0.99;
	source.connect(gainNode);

	// see https://developer.mozilla.org/en-US/docs/Web/API/PannerNode
	var panner = audioContext.createPanner();
	panner.panningModel = 'HRTF';
	panner.distanceModel = 'inverse';
	panner.refDistance = 1;
	panner.maxDistance = 10000;
	panner.rolloffFactor = 1;
	panner.coneInnerAngle = 360;
	panner.coneOuterAngle = 0;
	panner.coneOuterGain = 0;
	panner.setOrientation(1,0,0);
	panner.setPosition(2 * Math.random() - 1, 2 * Math.random() - 1, 2 * Math.random() - 1);
	panner.setVelocity(0, 0, 0);

	gainNode.connect(panner);
	panner.connect(audioContext.destination);
}

wireUpNodes(0);
wireUpNodes(1);
wireUpNodes(2);
wireUpNodes(3);

function chooseRandomRecording(soundsData, playerIndex) {
	var randomRecordingID = Math.floor(Math.random() * soundsData.recordings.length);

	var currentSound = soundsData.recordings[randomRecordingID];

	if (currentSound == null) {
		$('#status' + playerIndex).text('retrying');
		console.log('FAILED loading recording for player ' + playerIndex + ', retrying');
		chooseBird(playerIndex);
	}

	console.log(currentSound);
	$('#label' + playerIndex).text(currentSound.en);
	// TODO: parse currentSound.file as URL, get path, make root relative request
	var soundURL = currentSound.file.replace('http://www.xeno-canto.org','/soundfile');
	console.log(soundURL);
	$('audio')[playerIndex].setAttribute('src', soundURL);

	$('audio')[playerIndex].addEventListener('playing', function() {
		console.log("PLAYING");
		$('#status' + playerIndex).text('playing');
	});

	$('audio')[playerIndex].addEventListener('progress', function(e) {
		console.log("PROGRESS");

		if ($('audio')[playerIndex].readyState == 4) {
			$('#status' + playerIndex).text('playing');
		} else if ($('audio')[playerIndex].readyState == 3) {
			$('#status' + playerIndex).text('loading');
		}
	});
}

function chooseBird(inPlayerIndex) {
	var sighting = gBirds.chooseRandomSighting();
	console.log('chooseBird random sighting ' + sighting);

	// get sounds for this species if needed, and pick one at random
	gBirds.getSoundsForSighting(sighting, function(soundsData) {
		if (soundsData == null) {
			console.log('NO SOUNDS');
			$('#status' + inPlayerIndex).text('retrying');
			chooseBird(inPlayerIndex);
		} else {
			$('#label' + inPlayerIndex).text(gBirds.sightings[sighting].comName);
			chooseRandomRecording(soundsData, inPlayerIndex);
		}
	});	
}

$(document).ready(function(){ 
	gBirds.setLocation({ coords: { latitude: 37, longitude: -122 }}, function(position) {
		gBirds.getSightings(function() {
			chooseBird(0);
			chooseBird(1);
			chooseBird(2);
			chooseBird(3);
		});
	});
});



