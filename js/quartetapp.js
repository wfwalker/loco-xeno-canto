// app.js

// TODO: error handling for bogus sciName (throw exception?)
// TODO: push state / fragments in URL, repeatable testing?
// TODO: structured global / singleton
// TODO: factor out use of JSON api's for reuse
// TODO: add ember for quiz?
// TODO: do real web audio API four calls at once
// TODO: real object for sound library

var gBirds = new PlaceTimeBirdSongs();

// Fix up for prefixing
window.AudioContext = window.AudioContext||window.webkitAudioContext;
var audioContext = new AudioContext();

var source0 = audioContext.createMediaElementSource($('audio')[0]);
var gainNode = audioContext.createGain();
gainNode.gain.value = 0.99;
source0.connect(gainNode);
gainNode.connect(audioContext.destination);

var source1 = audioContext.createMediaElementSource($('audio')[1]);
source1.connect(audioContext.destination);
var source2 = audioContext.createMediaElementSource($('audio')[2]);
source2.connect(audioContext.destination);
var source3 = audioContext.createMediaElementSource($('audio')[3]);
source3.connect(audioContext.destination);

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
		$('#another').removeClass('disabled');
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



