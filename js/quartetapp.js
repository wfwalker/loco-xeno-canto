// app.js

// TODO: error handling for bogus sciName (throw exception?)
// TODO: push state / fragments in URL, repeatable testing?
// TODO: structured global / singleton
// TODO: factor out use of JSON api's for reuse
// TODO: add ember for quiz?
// TODO: do real web audio API four calls at once
// TODO: real object for sound library

var gQuizScope = new PlaceTimeBirdSongs();

// Fix up for prefixing
window.AudioContext = window.AudioContext||window.webkitAudioContext;
context = new AudioContext();

function chooseRandomRecording(soundsData, playerIndex) {
	var randomRecordingID = Math.floor(Math.random() * soundsData.recordings.length);
	var currentSound = soundsData.recordings[randomRecordingID];

	console.log(currentSound);
	$('#label' + playerIndex).text(currentSound.en);
	$('audio')[playerIndex].setAttribute('src', currentSound.file);

	$('audio')[playerIndex].addEventListener('playing', function() {
		console.log("PLAYING");
		console.log($('audio')[0].duration);
	});

	$('audio')[playerIndex].addEventListener('progress', function(e) {
		console.log("PROGRESS");
		console.log($('audio')[playerIndex].readyState);
	});
}

function chooseBird(inPlayerIndex) {
	var sighting = gQuizScope.chooseRandomSighting();
	console.log('chooseBird random sighting ' + sighting);

	// get sounds for this species if needed, and pick one at random
	gQuizScope.getSoundsForSighting(sighting, function(soundsData) {
		$('#another').removeClass('disabled');
		chooseRandomRecording(soundsData, inPlayerIndex);
	});	
}

$(document).ready(function(){ 
	gQuizScope.setLocation({ coords: { latitude: 37, longitude: -122 }}, function(position) {
		gQuizScope.getSightings(function() {
			chooseBird(0);
			chooseBird(1);
			chooseBird(2);
			chooseBird(3);
		});
	});
});



