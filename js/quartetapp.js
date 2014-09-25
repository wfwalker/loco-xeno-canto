// app.js

// TODO: error handling for bogus sciName (throw exception?)
// TODO: add ember for quiz?
// TODO: real object for sound library

var gBirds = new PlaceTimeBirdSongs();

// Fix up for prefixing
window.AudioContext = window.AudioContext||window.webkitAudioContext;
var audioContext = new AudioContext();

function wireUpNodes(inIndex) {
	var source = audioContext.createMediaElementSource($('audio')[inIndex]);
	var gainNode = audioContext.createGain();
	gainNode.gain.value = 0.99;
	source.connect(gainNode);
	gainNode.connect(audioContext.destination);
}

wireUpNodes(0);
wireUpNodes(1);
wireUpNodes(2);
wireUpNodes(3);

function chooseRandomRecording(soundsData, playerIndex) {
	var randomRecordingID = Math.floor(Math.random() * soundsData.recordings.length);
	var currentSound = soundsData.recordings[randomRecordingID];

	console.log(currentSound);
	$('#label' + playerIndex).text(currentSound.en);
	// TODO: parse currentSound.file as URL, get path, make root relative request
	var soundURL = currentSound.file.replace('http://www.xeno-canto.org','/soundfile');
	console.log(soundURL);
	$('audio')[playerIndex].setAttribute('src', soundURL);

	$('audio')[playerIndex].addEventListener('playing', function() {
		// console.log("PLAYING");
		// console.log($('audio')[0].duration);
	});

	$('audio')[playerIndex].addEventListener('progress', function(e) {
		// console.log("PROGRESS");
		// console.log($('audio')[playerIndex].readyState);
	});
}

function chooseBird(inPlayerIndex) {
	var sighting = gBirds.chooseRandomSighting();
	console.log('chooseBird random sighting ' + sighting);

	// get sounds for this species if needed, and pick one at random
	gBirds.getSoundsForSighting(sighting, function(soundsData) {
		$('#label' + inPlayerIndex).text(gBirds.sightings[sighting].comName);
		chooseRandomRecording(soundsData, inPlayerIndex);
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



