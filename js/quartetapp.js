// app.js

// TODO: add ember for quiz?

var gBirds = new PlaceTimeBirdSongs();

// GLOBAL sound sources for bird song playback
var soundSources = [];
var panners = [];

// GLOBAL initialize audio context
window.AudioContext = window.AudioContext||window.webkitAudioContext;
var audioContext = new AudioContext();

// GLOBAL initialize listener
var listener = audioContext.listener;
listener.dopplerFactor = 1;
listener.speedOfSound = 343.3;
listener.setOrientation(0,0,-1,0,1,0);

// TODO can we mess with playback rate
// https://developer.mozilla.org/en-US/Apps/Build/Audio_and_video_delivery/HTML5_playbackRate_explained

function wireUpNodes(inIndex) {
	soundSources[inIndex] = audioContext.createBufferSource();

	var gainNode = audioContext.createGain();
	gainNode.gain.value = 0.99;
	soundSources[inIndex].connect(gainNode);

	// see https://developer.mozilla.org/en-US/docs/Web/API/PannerNode
	panners[inIndex] = audioContext.createPanner();
	panners[inIndex].panningModel = 'HRTF';
	panners[inIndex].distanceModel = 'inverse';
	panners[inIndex].refDistance = 1;
	panners[inIndex].maxDistance = 10000;
	panners[inIndex].rolloffFactor = 1;
	panners[inIndex].coneInnerAngle = 360;
	panners[inIndex].coneOuterAngle = 0;
	panners[inIndex].coneOuterGain = 0;
	panners[inIndex].setOrientation(1,0,0);
	panners[inIndex].setPosition(2 * Math.random() - 1, 2 * Math.random() - 1, 2 * Math.random() - 1);
	panners[inIndex].setVelocity(0, 0, 0);

	gainNode.connect(panners[inIndex]);
	panners[inIndex].connect(audioContext.destination);
}

wireUpNodes(0);
wireUpNodes(1);
wireUpNodes(2);
wireUpNodes(3);

function setBufferFromURL(inIndex, inSoundDataURL) {
	console.log('setBufferFromURL ' + inIndex + ' ' + inSoundDataURL);

	var mp3Request = new XMLHttpRequest();

	mp3Request.onload = function(e) {
		$('#status' + inIndex).text('decoding');
		console.log(mp3Request.response);

	    audioContext.decodeAudioData(mp3Request.response, function(decodedBuffer) {
	    	console.log('inside decodeAudioData');
	    	console.log(decodedBuffer);
			soundSources[inIndex].buffer = decodedBuffer;
			soundSources[inIndex].loop = true;
			$('#status' + inIndex).text('playing ' + Math.round(decodedBuffer.duration) + 's');
			soundSources[inIndex].start(0);
		});
	};

	mp3Request.open("GET", inSoundDataURL, true);
	mp3Request.responseType = 'arraybuffer';
	$('#status' + inIndex).text('downloading');
	mp3Request.send();
}

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

	var soundURL = currentSound.file.replace('http://www.xeno-canto.org','/soundfile');
	console.log(soundURL);

	setBufferFromURL(playerIndex, soundURL);
}

function chooseBird(inPlayerIndex) {
	var sighting = gBirds.chooseRandomSighting();
	console.log('chooseBird random sighting ' + sighting);
	console.log(gBirds.sightings[sighting]);

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

	// TODO: can we play sounds backwards
	// TODO: can we incorporate the vocoder demo?

	$('#pitches').click(function(e) {
		console.log('RANDOMIZE PITCHES');

		soundSources[0].playbackRate.value = 0.2 + Math.random();		
		soundSources[1].playbackRate.value = 0.2 + Math.random();		
		soundSources[2].playbackRate.value = 0.2 + Math.random();		
		soundSources[3].playbackRate.value = 0.2 + Math.random();		
	});

	$('#locations').click(function(e) {
		console.log('RANDOMIZE LOCATIONS');

		panners[0].setPosition(2 * Math.random() - 1, 2 * Math.random() - 1, 2 * Math.random() - 1);
		panners[1].setPosition(2 * Math.random() - 1, 2 * Math.random() - 1, 2 * Math.random() - 1);
		panners[2].setPosition(2 * Math.random() - 1, 2 * Math.random() - 1, 2 * Math.random() - 1);
		panners[3].setPosition(2 * Math.random() - 1, 2 * Math.random() - 1, 2 * Math.random() - 1);
	});

	window.setInterval(function() {
		console.log('WAKEY');
	}, 5000);

});



